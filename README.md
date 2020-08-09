Given an arxiv ID such as 1112.4379, download the corresponding PDF file to your google drive as:
```
<root> / <category> / <year> / <title>.pdf
```
where `<root>` is an existing folder in your google drive, and the remaining fields are obtained
from the ID by querying the [arxiv API](https://arxiv.org/help/api).

This is implemented as a web service using [Google Apps Script](https://script.google.com/) that
takes URL query parameters:
 - id (required): identifier for the paper to download, e.g. 1311.1767.
 - root (default 'arxiver'): name of an existing drive folder that PDF files will be saved under.
 - maxsize (default 40Mb): maximum size in bytes of PDF file to download.
 - maxlen (default 250): truncate article title at this length for saved file name.

The latest published version is at:

https://script.google.com/a/uci.edu/macros/s/AKfycbyONjH15L_56ITZPrwitTU6fNQi8oTZLR8fWaK8Uy_VEIxXqcQ/exec

The latest dev version is at:

https://script.google.com/a/uci.edu/macros/s/AKfycbzCyU1cbzimtceCUTC1viP9NXxCNBsDgj5xrW6ppxo/dev

For now, these are only runnable by me to simplify google drive permissions during development.
