import bcrypt = require('bcrypt');

const saltRounds = 10;

export function encrypt(str: string): Promise<string> {
   return new Promise((resolve, reject) => {
      bcrypt.genSalt(saltRounds, (saltErr, salt) => {
         bcrypt.hash(str, salt, (hashErr, hash) => {
            hashErr ? reject(hashErr) : resolve(hash);
         });
      });
   });
}

export function compareHash(str: string, hash: string): Promise<boolean> {
   return new Promise((resolve, reject) => {
      bcrypt.compare(str, hash, (compErr, res) => {
         compErr ? reject(compErr) : resolve(res);
      });
   });
}
