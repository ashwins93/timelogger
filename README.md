# Time Logger Tim

Tim is your virtual time keeper. He keeps track of your employees' daily check in time. 

## Features
 * Two types of user accounts - Admin and Others.
 * Only the Admin can create new users.
 * Users can log in to see their account page where they have a few options:
   * They can check in once a day .
   * They can change their passwords any number of times.
   * They can view other users profile and send them messages (feature not implemented).
 * Admin users will see more options in their page:
   * Admins have the option to create new users (even other admins).
   * They have access to the "Admin Dashboard" where they can see all the check in times that all the users have logged so far. They can also see all the users listed here.
 * Users can see only their check in history unless they are admins.

 ## How to run it?

 ### Requirements
  * NodeJS must be installed version 7.9.0 and above (ES2017 must be supported).
  * MongoDB must be installed and properly configured.

### Instructions
 1. Run `npm install`.
 2. Run mongod (make sure you have set the --dbpath and the folder exists).
 3. You need to set the environment variable `DBURL` to point to your mongodb url. Alternatively you may consider using `.env` file to store your environmental variables (the app is configured to use `dotenv`).
 4. As said above only an admin user can create another user, this means that you need to be logged in as administrator in order to create accounts but there are no users in the database at first. To create the first admin account you need to run `node createAdmin.js` which creates an Admin account with username `admin` and password `password` (you can change it once you log in). Note: Anyone with your database url can use the createAdmin.js to create admin accounts, the `DBURL`must be kept a secret.
 5. Run `node app.js`. The app by default serves in the port 3000, but you can make it run on other PORT by setting the environmental variable PORT to your desired number.
 6. Success! Now Tim is live on your network, access it by browsing to the IP:PORT of the system from where it runs.

 ## Thanks
 My heartfelt thanks to the open source community. Thanks to Colt Steele and his course The Web Developer Bootcamp.

 ## Contributing
 I'm always looking for ideas and new features that must be added. Fork the repo, add any feature/fix any bug and send a PR. I will also be grateful to take some advice from you!
