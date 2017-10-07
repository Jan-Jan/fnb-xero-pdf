# Convert FNB statement pdfs to csv files for import into Xero

# Installation

First install `pdftotext` it is part of the `poppler` package:

* Mac: `brew install poppler`
* Linux: `apt-get install poppler-utils`
* Windows: as per [http://manifestwebdesign.com/2013/01/09/xpdf-and-poppler-utils-on-windows/](http://manifestwebdesign.com/2013/01/09/xpdf-and-poppler-utils-on-windows/)

then install this package globally

```bash
npm install -g fnb-xero-pdf
```

# Usage

## Convert all pdfs in a directory

If you want to convert all pdfs in the current directory, simply execute

```bash
fnb-xero-pdf
```

It will collate all the pdfs each into a csv specific to each account (identifiable by the account number).

If you want to convert all pdfs in another directory, simply add the relative path

```bash
fnb-xero-pdf docs
```

**Warning:** If you run this command multiple times in the same directory, it will append to existing csv files.

## Convert a single file

To convert a single simply add the filename is first parameter

```
fnb-xero-pdf accountfile.pdf
```

This will output/overwrite to a file with the same name, but `csv` suffix instead, e.g., `accountfile.csv`.
