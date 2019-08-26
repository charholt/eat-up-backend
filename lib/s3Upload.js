'use strict'
require('dotenv').config()
const AWS = require('aws-sdk')
const fs = require('fs')
const S3 = new AWS.S3()
const path = require('path')
const mime = require('mime-types')

const file = process.argv[2]

// promise version of fs.readfile
// should only worry about reading a file
const promiseReadFile = function (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

promiseReadFile(file)
  .then(fileData => {
    const type = mime.lookup(file)
    // use date to generate timestamp
    // use path.basename to geth the file name not full path
    const fileName = Date.now() + '_' + path.basename(file)

    const params = {
      Bucket: 'sei-upload',
      Key: fileName,
      Body: fileData,
      // look up mime type of the file to assign content type
      ContentType: type,
      ACL: 'public-read'
    }
    return params
  })
  .then(params => {
    return S3.upload(params).promise()
  })
  .catch(console.error)

module.exports = S3
