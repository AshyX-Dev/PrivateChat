class UserContent {
    constructor(result = {}){
        if (!(result instanceof UserContent)){
            this.auth = result.auth || null;
            this.id = result.id || null;
            this.phone_number = result.phone_number || null;
            this.name = result.name || null;
            this.profile_path = result.profile_path || null;
            this.bio = result.bio || null;
            this.chat_hash = result.chat_hash || null;
            this.has_tick = result.has_tick || null;
        }else{
            this.auth = result.auth;
            this.id = result.id;
            this.phone_number = result.phone_number;
            this.name = result.name;
            this.profile_path = result.profile_path;
            this.bio = result.bio;
            this.chat_hash = result.chat_hash;
            this.has_tick = result.has_tick;
        }
    }

    getProfileStream(){
        return fs.createReadStream(`profiles_0032/${this.profile_path}`);
    }

}

class User {
    constructor(result = {}){
        this.id = result.id || null;
        if (typeof result.chats == "string") this.chats = JSON.parse(result.chats);
        else this.chats = result.chats;
        if (typeof result.content == "string") { this.content = new UserContent(JSON.parse(result.content)); }
        else if (typeof result.content == "object" && this.content !== null && !Array.isArray(this.content)) { this.content = new UserContent(result.content); }
        else { this.content = new UserContent(result.content); }
    }
}

module.exports = { UserContent, User }