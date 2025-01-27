// Send Code to Number

const sqlite3 = require("sqlite3").verbose();
const { Cryptography } = require("./cryptography");
const { User, UserContent } = require("./interfaces");
const { getTime } = require("./zone");
const fs = require("fs");

let photo_formats = ['png', 'jpg'];

if (!(fs.existsSync("profiles_0032"))) fs.mkdirSync("profiles_0032")

class XObjects {
    createMessageObject(
        {
            text = "",
            message_time = new Date(),
            message_id = 0
        } = {}
    ){
        return {
            text: text,
            message_time: message_time.getTime(),
            message_id: message_id,
            message_text_length: text.length,
            message_type: "text",
        };
    }

    createMediaMessageObject(
        {
            text = "",
            message_time = new Date(),
            message_id = 0
        } = {}
    ){
        true // will develop ...
    }
}

class XRelizable {
    constructor(){
        this.crypto = new Cryptography();
        this.objects = new XObjects();
        this.users = new sqlite3.Database("users.db", (error) => {
            if (error){
                console.log(`[pc] error connecting to users database: ${error}`);
                process.exit(1);
            }
            console.log("[pc] connected to users database file");
            this.setup();
        })
    }

    setup(){
        this.users.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, content TEXT, chats TEXT)", (error) => {
            if (error){
                console.log(`[pc] error while creating users table: ${error}`);
                process.exit(1);
            }
        });
    }

    trimPhone(phone = new String()){
        if (phone.startsWith("+98")){
            return "0" + phone.slice(3, phone.length);
        }else if (phone.startsWith("98")){
            return "0" + phone.slice(2, phone.length);
        }else if (phone.startsWith("0")){
            return phone;
        }else{
            return "0" + phone;
        }
    }

    async getUsers(callback = () => {}){
        this.users.all('SELECT * FROM users', [], (err, rows) => {
            if (err) {
                console.log(err);
            }
            // Process the rows
            callback(rows)
        });
    }

    async getUserById(id, callback = () => {}) {
        await this.getUsers((users) => {
            for (const user of users) {
                let usr = new User(user);
                if (usr.id == id) {
                    return callback({ status: "OK", user: usr });
                }
            }
            callback({ status: "INVALID_USER_ID" });
        });
    }

    async getUserByAuth(auth, callback = () => {}) {
        await this.getUsers((users) => {
            for (const user of users) {
                let usr = new User(user);
                if (usr.content.auth === auth){
                    return callback({ status: "OK", user: usr });
                }
            }
            callback({ status: "INVALID_USER_AUTH" });
        });
    }

    async getUserByPhone(phone_number, callback = () => {}) {
        let phone = this.trimPhone(phone_number);
        await this.getUsers((users) => {
            for (const user of users) {
                let usr = new User(user);
                if (usr.content.phone_number === phone){
                    return callback({ status: "OK", user: usr });
                }
            }
            callback({ status: "INVALID_USER_PHONE_NUMBER" });
        });
    }

    async getUserByChatHash(chat_hash, callback = () => {}){
        await this.getUsers((users) => {
            for (const user of users) {
                let usr = new User(user);
                if (usr.content.chat_hash === chat_hash){
                    return callback({ status: "OK", user: usr });
                }
            }
            callback({ status: "INVALID_CHAT_HASH" });
        });
    }

    async addTick(
        auth = new String(),
        callback = () => {}
    ){
        await this.getUserByAuth(auth, (user) => {
            if (user.status === "OK"){
                user.user.content.has_tick = true;
                this.users.run("UPDATE users SET content = ? WHERE id = ?", [JSON.stringify(user.user.content), user.user.id], (err) => {
                    if (err){
                        return callback({ status: "CANNOT_ADD_TICK" });
                    }else{ return callback({ status: "OK" }) };
                })
            }
        })
    }

    async removeTick(
        auth = new String(),
        callback = () => {}
    ){
        await this.getUserByAuth(auth, (user) => {
            if (user.status === "OK"){
                user.user.content.has_tick = false;
                this.users.run("UPDATE users SET content = ? WHERE id = ?", [JSON.stringify(user.user.content), user.user.id], (err) => {
                    if (err){
                        return callback({ status: "CANNOT_REMOVE_TICK" });
                    }else{ return callback({ status: "OK" }) };
                })
            }
        })
    }

    // async isValidString(input) {
    //     const regex = /^[a-zA-Z0-9_]+$/;
    //     return regex.test(input);
    // }

    async addAccount(
        name = new String(),
        phone_number = new String(),
        bio = new String(),
        callback = () => {}
    ){
        await this.getUserByPhone(phone_number, (user) => {
            if (user.status === "OK"){
                return callback({ status: "EXISTS_PHONE_NUMBER" });
            }

            if (!(0 < name.length && name.length < 20)){
                return callback({ status: "INVALID_NAME_LENGTH" })
            }

            if (!(0 <= bio.length && bio.length < 20)){
                return callback({ status: "INVALID_BIO_LENGTH" })
            }

            const uid = this.crypto.createId();
            const uauth = this.crypto.createAuth();
            const user_data = {
                name: name,
                phone_number: this.trimPhone(phone_number),
                bio: bio,
                profile_path: null,
                auth: uauth,
                id: uid
            };
            this.users.run("INSERT INTO users (id, content, chats) VALUES (?, ?, ?)", [
                uid,
                JSON.stringify(user_data),
                "{}"
            ], (err) => {
                if (err){
                    return callback({ status: "CANNOT_INSERT" });
                }else{
                    return callback({ status: "OK", user: user_data });
                }
            })
        })
    }

    async updateAccount(
        auth = new String(),
        name = new String(),
        bio = new String(),
        callback = () => {}
    ){
        await this.getUserByAuth(auth, (user) => {
            if (!(user.status === "OK")){
                return callback({ status: "INVALID_AUTH" });
            }

            if (!(0 < name.length && name.length < 20)){
                return callback({ status: "INVALID_NAME_LENGTH" })
            }

            if (!(0 <= bio.length && bio.length < 20)){
                return callback({ status: "INVALID_BIO_LENGTH" })
            }

            const user_data = {
                name: name && name.length > 0 ? name : user.user.content.name,
                phone_number: user.user.content.phone_number,
                bio: bio && bio.length > 0 ? bio : user.user.content.bio,
                profile_path: user.user.content.profile_path,
                auth: user.user.content.auth,
                id: user.user.id
            };
            this.users.run("UPDATE users SET content = ? WHERE id = ?", [
                JSON.stringify(user_data),
                user_data.id
            ], (err) => {
                if (err){
                    return callback({ status: "CANNOT_UPDATE" });
                }else{
                    return callback({ status: "OK", user: user_data });
                }
            })
        })
    }

    async deleteAccount(
        auth = new String(),
        callback = () => {}
    ){
        await this.getUserByAuth(auth, (user) => {
            if (!(user.status === "OK")){
                return callback({ status: "INVALID_AUTH" });
            }

            this.users.run("DELETE FROM users WHERE id = ?", [
                user.user.id
            ], (err) => {
                if (err){
                    return callback({ status: "CANNOT_DELETE" });
                }else{
                    return callback({ status: "OK" });
                }
            })
        })
    }

    async setAvatar(auth, encodedBytes, format = "png", callback = () => {}) {
        await this.getUserByAuth(auth, (user) => {
            if (user.status !== "OK") {
                return callback({ status: "INVALID_AUTH" });
            }
    
            if (!photo_formats.includes(format)) {
                return callback({ status: "INVALID_FORMAT" });
            }
    
            try {
                let dec_bytes = Buffer.from(encodedBytes, "base64");
                let fname = `profiles_0032/${this.crypto.createPhotoName(format)}`;
                fs.writeFile(fname, dec_bytes, (err) => {
                    if (!err) {
                        return callback({ status: "OK" });
                    } else {
                        callback({ status: "SERVER_ERROR", message: err });
                    }
                });
            } catch (e) {
                callback({ status: "SERVER_ERROR", message: e });
            }
        });
    }
}

const xr = new XRelizable();
// xr.users.serialize(() => {
  
//     let stmt = xr.users.prepare("INSERT INTO users VALUES (?, ?, ?)");
//     stmt.run(9999234324, JSON.stringify({auth: "123456789asdfghjklzxcvbnmqwertyu"}), "{}");
//     stmt.finalize();
// });

// xr.getUserById(9999234324, (user = new User()) => {console.log(user)})
// xr.addAccount(
//     "Ashy X",
//     "+989904541580",
//     "",
//     (user_data) => {
//         console.log(user_data);
//     }
// )



// xr.getUserByPhone("+989904541580", (users) => {console.log(users)})
// xr.updateAccount("80662cf21172b117ae02d0019eda0c77", "Ashy - X", "", (user) => {console.log(user)})
// xr.deleteAccount("80662cf21172b117ae02d0019eda0c77", (user) => {console.log(user)})
// console.log(fs.createReadStream("profiles_0032/test.png"));

// console.log(fs.createReadStream("profiles_0032/photo_51900662.jpg").bytesRead)

// let n =  Buffer.from(fs.readFileSync("C:\\Users\\ELMGOSTAR\\Pictures\\Screenshots\\back_track.jpg")).toString("base64");
//xr.setAvatar("80662cf21172b117ae02d0019eda0c77", n, 'jpg', (x) => {console.log(x)})