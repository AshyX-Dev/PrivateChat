const crypto = require("crypto");

class Cryptography {
    constructor(){
        this.iv = Buffer.from('0'.repeat(32), 'hex');
    }

    encrypt(text, key) {
        try {
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), this.iv);
            let encrypted = cipher.update(text, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            return { enc: encrypted, error: false };
        } catch (error) {
            return { enc: error.message, error: true };
        }
    }

    decrypt(encodedText, key) {
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), this.iv);
            let decrypted = decipher.update(encodedText, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return { dec: decrypted, error: false };
        } catch (error) {
            return { dec: error.message, error: true };
        }
    }

    createAuth(){
        const master = crypto.createHash(
            "sha256"
        ).update(
            ( Math.floor(Math.random() * 999999) - 1000 ).toString()
        ).digest('hex')

        return crypto.createHash(
            "md5"
        ).update(
            master
       ).digest('hex');
    }

    createId(){
        return Math.floor(Math.random() * 99999999) - 1000;
    }

    createMessageId(){
        return Math.floor(Math.random() * 99999999999) - 100000;
    }

    createPhotoName(format = "png"){
        return `photo_${this.createId()}.${format}`;
    }

}

module.exports = {
    Cryptography
}