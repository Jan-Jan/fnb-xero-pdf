const path = require('path')
const extract = require('pdf-text-extract')
// load all pdfs

console.log(`arg[0] = ${process.argv[0]}`)
console.log(`arg[1] = ${process.argv[1]}`)
console.log(`arg[2] = ${process.argv[2]}`)

const filePath = process.argv[2];

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


const reDate = /Statement Date[\ :]+(\d\d) ([A-Za-z]+) (\d\d\d\d)/
const reTransaction = /([0-9]{2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\s+([\#\w\s(?!\s)]+)\s\s+[\w\s]*\s\s+([0-9]+[0-9\s\,]+\.[0-9]{2}\s{0,1}[Cr]{0,2})+/
const reAccountNumber = /(cheque\saccount|credit\scard)\s+([0-9\s]+)/i

extract(filePath, { splitPages: false }, function (err, text) {
  if (err) {
    console.dir(err)
    return
  }
  const csvs = ['Date,Amount,Description']
  const lines = text.join('\n').split('\n')
  let date 
  let year
  let accountNumber
  text.join('\n').split('\n')
    .forEach(line => {

      // console.log(line)
      if (!date) {
        const match = line.match(reDate)
        if (match) {
          date = `${match[3]}-${monthDigits[match[2].slice(0,3)]}-${match[1]}`
          year = match[3]
        }
        return;
      }
      if (!accountNumber) {
        console.log(line)
        const match = line.match(reAccountNumber)
        if (match) {
          accountNumber = match[2].replace(/(\s\s+)/g, ',').split(',')[0]
          console.log(`accountNumber =`, accountNumber)
        }
        return;
      }
      // console.dir(line)
      const match = line.match(reTransaction)
      if (match) {
        const tDate = `${match[1]} ${year}`
        const tAmount = match[4].slice(-2) === `Cr`
          ? `${match[4].match(/[0-9]+[0-9\.\s\,]+[0-9]{2}/)[0].replace(/[\s\,]/g, '')}`
          : `-${match[4].replace(/[\s\,]/g, '')}`
        const tDescription = match[3].replace(/(\s\s+)/g, ',').split(',')[0]
        const csvLine = `${tDate},${tAmount},${tDescription}`
        console.log(csvLine)
        csvs.push(csvLine)
      }
    })
})
// check which type
/**
 * grab 'Statement Date : 11 April 2016'
 *    extract year
 *    convert to 2016-04-11
 * grab 'FNB Private Wealth Cheque Account 62374114404'
 *   extract accountNumber
 * after 'Opening Balance'
 *   grab eg '(16 Mar) (Internet Trf To) (Jj Cheq 2 Biz Cheq) () (1,000.00) (14,138.40 Cr)( )'
 *     convert to '16 Mar 2016, Internet Trf To, Jj Cheq 2 Biz Cheq, -1000.00'
 *       handle second part of description
 *       remove bank charges
 *       handle Cr
 *       handle multi-page
 *     remove lines with zero cost
 *   stop at 'Closing Balance'
 *
 * grab 'Statement Date            30 March 2016'
 * grab 'Corporate Control Account 8812 7129 0944 2007'
 *   extract accountNumber
 * after 'Balance Brought Forward'
 *   grab eg '(16 Mar) (#Credit Limit Fee) (15.00) ( )'
 *     convert to '16 Mar 2016, #Credit Limit Fee, -15.00'
 *       remove Bedget Facility
 *       handle Cr
 *       handle multi-page
 *     remove lines with zero cost
 *   stop at 'Closing Balance'
 */
// process according to type
// output: YYYY-MM-DD <accountnumber>
