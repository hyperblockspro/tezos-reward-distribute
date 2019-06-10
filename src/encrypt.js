/**
 * AES Encryption/Decryption with AES-256-GCM using random Initialization Vector + Salt.
 * https://gist.github.com/niryeffet/99595f7a70db38acf238d7c3366b3f49
 * @type {exports}
 */

// load the build-in crypto functions
var crypto = require('crypto')

// encrypt/decrypt functions
module.exports = {

  /**
     * Encrypts text by given key
     * @param String text to encrypt
     * @param Buffer masterkey
     * @returns String encrypted text, base64 encoded
     */
  encrypt: function (text, masterkey) {
    // random initialization vector
    var iv = crypto.randomBytes(16)

    // random salt
    var salt = crypto.randomBytes(64)

    // derive key: 32 byte key length - in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    var key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512')

    // AES 256 GCM Mode
    var cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    // encrypt the given text
    var encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])

    // extract the auth tag
    var tag = cipher.getAuthTag()

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
  },

  /**
     * Decrypts text by given key
     * @param String base64 encoded input data
     * @param Buffer masterkey
     * @returns String decrypted (original) text
     */
  decrypt: function (data, masterkey) {
    // base64 decoding
    var bData = Buffer.from(data, 'base64')

    // convert data to buffers
    let salt = bData.slice(0, 64)
    let iv = bData.slice(64, 80)
    let tag = bData.slice(80, 96)
    let text = bData.slice(96)

    // derive key using; 32 byte key length
    var key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512')

    // AES 256 GCM Mode
    var decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)

    // encrypt the given text
    var decrypted = decipher.update(text, undefined, 'utf8') + decipher.final('utf8')

    return decrypted
  }
}
