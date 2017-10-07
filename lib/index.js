const fs = require('fs')
const path = require('path')
const extract = require('pdf-text-extract')
const async = require('async')
// load all pdfs

const monthDigits = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
}

const months = Object.keys(monthDigits);

const header = ['*Date,*Amount,Description,Reference']

const reDate = /Statement Date[\ :]+(\d\d) ([a-z]+) (\d\d\d\d)/i
const reTransaction = /([0-9]{2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\s+([\#\*\w\s]+)\s\s+([0-9]*[\s\,]{0,1}[0-9]{1,3}\.[0-9]{2}\s{0,1}[Cr]{0,2})+/
const reAccountNumber = /(cheque\sacc|account\snumber|account|credit\scard)\s+([0-9\s]+)/i

const extractDate = line => {

  const match = line.match(reDate)
  const day = match[1]
  const month = match[2].slice(0,3)
  const year = match[3]
  return { year, month, day }
}

const extractAccountNumber = line => {

  const match = line.match(reAccountNumber)
  return match[2].replace(/(\s\s+)/g, ',').split(',')[0]
}

const convertTransactionDate = date => {
  const match = date.match(/(\d{2})\s+([a-z]{3})/i)
  return `${monthDigits[match[2]]}/${match[1]}`
}

const filePaths = process.argv[2] && process.argv[2].slice(-4) === '.pdf'
  ? [process.argv[2]]
  : fs.readdirSync(process.argv[2] || './')
      .filter(file => file.slice(-4) === '.pdf')

async.eachSeries(filePaths, (filePath, callback) => {

  extract(filePath, { splitPages: false }, function (err, text) {
    if (err) {
      console.dir(err)
      return
    }

    const lines = text.join('\n').split('\n')

    const dateLine = lines.find(line => line.match(reDate))
    const { year, month, day } = extractDate(dateLine)

    const accountNumberLine = lines.find(line => line.match(reAccountNumber))
    if (!accountNumberLine) {
      throw new Error('No account number found.')
    }
    const accountNumber = extractAccountNumber(accountNumberLine)

    const transactions = lines
      .map(line => {
        const match = line.match(reTransaction)
        if (match) {
          // handle year change over Dec-Jan
          const tYear = month === 'Jan' && match[1].slice(-3) === 'Dec' ? Number(year) - 1 : year
          const tDate = `${tYear}/${convertTransactionDate(match[1])}`
          // if amount has trailing `Cr` it is positive (&& remove `Cr`) else negative
          const tAmount = match[4].slice(-2) === `Cr`
            ? `${match[4].match(/[0-9]+[0-9\.\s\,]+[0-9]{2}/)[0].replace(/[\s\,]/g, '')}`
            : `-${match[4].replace(/[\s\,]/g, '')}`
          // keep only the first description, scrap the rest
          const tDescription = match[3].replace(/(\s\s+)/g, ',')
            .split(',')
            .slice(0,2)
            .join(',')

          return `${tDate},${tAmount},${tDescription}`
        }
        return;
      })
      .filter(line => line)
      .sort()

    const filename = filePaths.length === 1
      ? `${filePath.slice(0,-3)}csv`
      : `${accountNumber}.csv`

    const fileExists = fs.existsSync(filename)
    const contents = fileExists && filePaths.length !== 1
      ? transactions.join('\n')+'\n'
      : header.concat(transactions).join('\n')+'\n'

    console.log(`Processing ${filePath} -> ${filename}`)

    const asyncWrite = filePaths.length === 1
      ? fs.writeFile // overwite if only 1 file
      : fs.appendFile

    return asyncWrite(filename, contents, callback)
  }, (err) => {

    // if any of the file processing produced an error, err would equal that error
    if( err ) {
      // One of the iterations produced an error.
      // All processing will now stop.
      console.log('A file failed to process');
    } else {
      console.log('All files have been processed successfully');
    }
})
})
