//==========================================================================================
// Google Apps Script to download an arxiv PDF file to a user's Google Drive.
// For details and usage, see https://github.com/dkirkby/arxiver
//==========================================================================================

/* Locate the root drive folder to use or report an error if not found or unique. */
function getRootFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if(!folders.hasNext()) {
    throw new Error('Create a drive folder named "' + name + '" to use this service.');
  }
  var folder = folders.next();
  if(folders.hasNext()) {
    throw new Error('Cannot save to the folder named "' + name + '" because it is not unique on your drive.');
  }
  return folder;
}

/* Enter the named sub-folder, creating it if necessary. */
function enterFolder(parent, name) {
  children = parent.getFoldersByName(name);
  if(children.hasNext()) {
    child = children.next();
    if(children.hasNext()) {
      throw new Error('Found duplicate folder "' + parent.getName() + '/' + name + '".');
    }
  }
  else {
    child = parent.createFolder(name);
  }
  return child;
}

/* Lookup the named child of a parent node in an XML parse tree. */
function getChild(parent, name, ns, id) {
  var child = parent.getChild(name, ns);
  if(child == null) {
    throw new Error('Query result missing required element "' + name + '" for arxiv:' + id);
  }
  return child;
}

/* Fetch a URL and return an HTTPResponse or throw an informative Error. */
function fetch(url, error_message) {
  var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
  if(response == null) {
    throw new Error(error_message + ' .Can this ever happen?');
  }
  if(response.getResponseCode() != 200) {
    throw new Error(error_message + ' failed with HTTP error ' + response.getResponseCode() +
      ': ' + response.getContentText());
  }
  return response;
}

/* Query the arxiv API for a single article specified by it's id. */
function queryArxiv(id) {
  // Following the example at https://developers.google.com/apps-script/reference/xml-service
  // The arxiv API is documented at https://arxiv.org/help/api/user-manual#_calling_the_api
  if(id == null) {
    throw new Error('Missing required query parameter "id".');
  }
  var url = 'http://export.arxiv.org/api/query?id_list=' + id;
  var queryResponse = fetch(url, 'Query fetch failed for id ' + id);
  var xml = queryResponse.getContentText();
  var document = XmlService.parse(xml);
  var root = document.getRootElement();
  var atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  var entries = root.getChildren('entry', atom);
  if(entries.length == 0) {
    throw new Error('No entry found for id ' + id);
  }
  if(entries.length > 1) {
    throw new Error('Got multiple entries for id ' + id);
  }
  var entry = entries[0];
  result = {};
  result['title'] = getChild(entry, 'title', atom, id).getText();
  result['abstract'] = getChild(entry, 'summary', atom, id).getText();
  // published refers to the initial arxiv submission, not journal submission.
  var date = getChild(entry, 'published', atom, id).getText();
  result['year'] = new String(new Date(date).getFullYear());
  // The primary category is under an arxiv specific namespace.
  var arxivAtom = XmlService.getNamespace('http://arxiv.org/schemas/atom');
  var category = getChild(entry, 'primary_category', arxivAtom, id);
  var term = category.getAttribute('term');
  if(term == null) {
    throw new Error('Query result has invalid primary_category.');
  }
  result['category'] = term.getValue();
  // scan the links looking for the one with attribute title="pdf"
  var links = entry.getChildren('link', atom);
  for(var i=0; i < links.length; i++) {
    var link = links[i];
    var title = link.getAttribute('title');
    if(title && title.getValue() == 'pdf') {
      var href = link.getAttribute('href');
      if(href == null) {
        throw new Error('Query result has invalid PDF link for id ' + id);
      }
      result['pdfLink'] = href.getValue();
      break;
    }
  }
  if(result['pdfLink'] == null) {
    throw new Error('Query result is missing a PDF link for id ' + id);
  }
  return result;
}

/* Download a PDF file into a binary Blob. */
function getPdf(pdfLink, maxSize, result) {
  // Use export.arxiv.org insead of arxiv.org. See https://arxiv.org/denied.html.
  pdfLink = pdfLink.replace('//arxiv.org', '//export.arxiv.org');
  var fetchResponse = fetch(pdfLink, 'PDF fetch for id ' + result['id']);
  var pdfSize = new Number(fetchResponse.getHeaders()['Content-Length']);
  result['pdfSize'] = pdfSize;
  if(pdfSize > maxSize) {
    throw new Error('PDF size (' + pdfSize + ' bytes) exceeds maximum allowed (' +
                    maxSize + ' bytes) for arxiv:' + result['id']);
  }
  return fetchResponse.getBlob();
}

/* Main service entry point.

The only required paramter is 'id', e.g. id=1311.1767. Optional parameters are:

 - root (default 'arxiver'): name of an existing drive folder that PDF files will be saved under.
 - maxsize (default 40Mb): maximum size in bytes of PDF file to download.
 - maxlen (default 250): truncate article title at this length for saved file name.

Returns a JSON result with 'status':'ok' if successful, or else 'status':'error' with a
descriptive 'message'.
*/
function doGet(e) {
  var result = {};
  try {
    // First make sure we can access the destination root folder.
    var rootFolder = getRootFolder(e.parameter['root'] || 'arxiver');
    // Look up the metadata for this article.
    info = queryArxiv(e.parameter['id']);
    result['id'] = e.parameter['id'];
    result['title'] = info['title'];
    result['pdfLink'] = info['pdfLink'];
    result['category'] = info['category'];
    result['year'] = info['year'];
    // Fetch the PDF file.
    pdfBlob = getPdf(info['pdfLink'], new Number(e.parameter['maxsize'] || (40 << 20)), result);
    result['pdfSize'] = pdfBlob.getBytes().length;
    // Find the destination folder, creating the path if necessary.
    var categoryFolder = enterFolder(rootFolder, info['category']);
    result['categoryLink'] = categoryFolder.getUrl();
    var yearFolder = enterFolder(categoryFolder, info['year']);
    result['yearLink'] = yearFolder.getUrl();
    // Save the PDF file to the destination folder.
    var file = yearFolder.createFile(pdfBlob);
    // The URL returned by getUrl ends with '?usp=drivesdk' which just means it was
    // generated by the Drive SDK.
    result['fileLink'] = file.getUrl();
    // Set the file name and description. Note that drive does not have any restrictions on the
    // characters used, although some might cause problems when mirroring to a local disk.
    var name = info['title'];
    // Replace sequences of whitespace (including newline) with a single space.
    name = name.replace(/\s+/g, ' ');
    // Replace sequences of special characters with a single underscore.
    name = name.replace(/[\*\/]+/g, '_')
    // Truncate to the requested maximum length (after substitutions).
    var maxlen = new Number(e.parameter['maxlen'] || 250);
    if(name.length > maxlen) {
      name = name.substr(0, maxlen-1);
    }
    name = name + '.pdf';
    result['name'] = name;
    file.setName(name);
    var description = [info['pdfLink'], info['title'], info['abstract']].join('\n\n');
    file.setDescription(description);
    result['status'] = 'ok';
  }
  catch(error) {
    result['status'] = 'error';
    result['message'] = error.message;
  }
  // Return either JSON or JSONP, depending on whether we have a callback parameter.
  var callback = e.parameter['callback'];
  var json = JSON.stringify(result);
  if(callback == null) {
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }
  else {
    return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}
