'use strict'
require('dotenv').config()

const AWS = require('aws-sdk')
const S3 = new AWS.S3()
const uploadImage = function (image) {
  return new Promise((resolve, reject) => {
    var params = {
      Bucket: 'sei-upload',
      Key: `${Date.now()}_${image.originalname}`,
      Body: image.buffer,
      ContentType: image.mimetype,
      ACL: 'public-read'
    }
    S3.upload(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

module.exports = uploadImage
