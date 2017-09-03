# GroupMe bot written in Node.js

## Requirements:

  * GroupMe account
  * Heroku account
  * GitHub account
  * Giphy API key
  * [sprintf-js](https://www.npmjs.com/package/sprintf-js) for formatting the stats response

## What it does:

  * Meniton everyone in the group
    * @all
  	* @everyone
  	* @guys
  * Display statistics on the group
  	* @stats
  	* @stats "number of messages to analyze"
  	* @stats @"user name"
  	* @stats @"user name" "number of messages to analyze"
  * Post gifs from Giphy
    * #"search term"
    * #trending

# Get your bot up and running

## Create a GroupMe Bot:

Go to:
https://dev.groupme.com/session/new

Use your GroupMe credentials to log into the developer site.

Once you have successfully logged in, go to https://dev.groupme.com/bots/new

Fill out the form to create your new bot:

  * Select the group where you want the bot to live
  * Give your bot a name
  * (Optional) Give your bot an avatar by providing a url to an image
  * Click submit

## Set up your bot:

Clone this repository, and edit the config.js file. Add in the Bot ID, Group ID, and your access token. Add the code to your own repository, and then edit the app.json file. Change the logo to the url of the bot avatar, and change the repository to the url of your repository.

## Add your bot to your Heroku app:

Go to Heroku and create a new app.

On your app page, click settings in the top navigation and click the Reveal Config Vars button.

Then click edit and fill out the form to add an environment variable to your app:

  * In the "key" field type: BOT_ID
  * In the "value" field paste your Bot ID
  * Click the save button

Next go back to the bot page on the GroupMe developer site, and add the callback url to your bot. The callback url should just be http://"your app name".herokuapp.com/

Then go to the package.json file and change the repository url to the url of your repository and the name to the name of the heroku app you just create.

## Deploy on Heroku:

Log in to Heroku and go to your app and the Deploy tab. Link the app to your GitHub repository, and then deploy it. It should be up and running.
