{
    let title=document.querySelector('meta[property="og:title"]').content;
    let abstract=document.querySelector('meta[property="og:description"]').content;
    let pdf_url=document.querySelector('meta[name="citation_pdf_url"]').content;
    let year=new Date(document.querySelector('meta[name="citation_date"]').content).getFullYear();
    let topic=document.querySelector('.subheader h1').textContent.split(/\s*>\s*/)[0];
    let path=topic + "/" + year + "/" + title + ".pdf";
    alert("Saving to " + path);
}
