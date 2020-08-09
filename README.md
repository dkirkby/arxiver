Given an arxiv ID such as 1112.4379, down the corresponding PDF file to your google drive as:
```
<root> / <category> / <year> / <title>.pdf
```
where `<root>` is an existing folder in your google drive, and the remaining fields are obtained
from the ID by querying the [arxiv API](https://arxiv.org/help/api).

This is implemented as a web service using [Google Apps Script](https://script.google.com/).

The current published version (currently only runnable by me):

https://script.google.com/a/uci.edu/macros/s/AKfycbyONjH15L_56ITZPrwitTU6fNQi8oTZLR8fWaK8Uy_VEIxXqcQ/exec

The latest dev version is at:

https://script.google.com/a/uci.edu/macros/s/AKfycbzCyU1cbzimtceCUTC1viP9NXxCNBsDgj5xrW6ppxo/dev