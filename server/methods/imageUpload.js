import { Meteor } from 'meteor/meteor';
import { WalletImages } from '../../lib/database/Images.js';
import { Currencies } from '../../lib/database/Currencies.js';
import { Ratings } from '../../lib/database/Ratings.js';
import { RatingsTemplates } from '../../lib/database/Ratings.js';

Meteor.methods({
  'addRatingQuestion': function(question, catagory) {
    if(!Meteor.user()._id){throw new Meteor.Error('error', 'please log in')};
    var id = parseInt("0x" + CryptoJS.MD5(question).toString().slice(0,10), 16);
    var id = id.toString();
    console.log(id);
    RatingsTemplates.insert({
      _id: id,
      'question': question,
      'catagory': catagory,
      'createdBy': Meteor.user()._id,
      'createdAt': new Date().getTime()
    });
  },
  'populateRatings': function() {
    //fetch all the currencies this user uses:
    var images = WalletImages.find({createdBy: Meteor.user()._id}).fetch();
    var currencies = [];
    for (i in images) {
      currencies.push(images[i].currencyId);
    }
    var currencies = _.uniq(currencies);

    //fetch the questions that will be asked of the user
    var ratingTemplates = RatingsTemplates.find({catagory:"wallet"}).fetch();
    var userInt = parseInt("0x" + CryptoJS.MD5(Meteor.user()._id).toString().slice(0,10), 16);

//Cycle through all possible combinations of currencies that this user has a wallet for
    for (i = 0; i < currencies.length - 1; i++) {
      for (j = i + 1; j < currencies.length; j++) {
        //we don't want to generate duplicate currency pairs for the user, the fastest way to make sure
        //is to combine the currency pairs and user ID into a number so that no matter what way
        //you combine this the result will be the same, new additions can then be compared immediately
       //and be verified unique for this user.
        var dec_i = parseInt("0x" + CryptoJS.MD5(currencies[i]).toString().slice(0,10), 16);
        var dec_j = parseInt("0x" + CryptoJS.MD5(currencies[j]).toString().slice(0,10), 16);
        //add truncated MD5 of currencyId's and userId to prevent duplicates
        var _id = dec_i + dec_j + userInt;
        //add question truncated MD5 Int to the _id
        for (k in ratingTemplates) {
          console.log(currencies[i] + " " + currencies[j] + " " + ratingTemplates[k]._id)
          id = (_id + parseInt(ratingTemplates[k]._id, 10)).toString();
          console.log(id);
          try{
            Ratings.insert({
              _id: id,
              'owner': Meteor.user()._id,
              'currency0': currencies[i],
              'currency1': currencies[j],
              'winner': null,
              'questionId': ratingTemplates[k]._id,
              'questionText': ratingTemplates[k].question,
              'createdAt': new Date().getTime(),
              'processedAd': null,
              'processed': false,
              'catagory': ratingTemplates[k].catagory,
              'type': "wallet",
              'answeredAt': null,
              'Answered': false
            })
          } catch(error) {
            //FIXME log errors
          }
        }
        //create new Ratings item for each question and each currency pair for this userId



        //console.log(currencies[i] + " + " + currencies[j]);
      }
    }
  },
    'uploadWalletImage': function (fileName, imageOf, currencyId, binaryData, md5) {
      var error = function(error) {throw new Meteor.Error('error', error);}
      var md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString();
      if(md5validate != md5) {
        throw new Meteor.Error('connection error', 'failed to validate md5 hash');
        return false;
      }
        if (!this.userId) {
          console.log("NOT LOGGED IN");
          throw new Meteor.Error('error', 'You must be logged in to do this.');
          return false;
        }
        var fs = Npm.require('fs');
        var filename = ('/Users/gareth/git/blockrazor/temp/static/images/wallets/' + md5 + '.' + 'jpg'); //FIXME
        var insert = false;
        //var currency = Currencies.findOne({_id:currencyId}).currencyName;
        if(!Currencies.findOne({_id:currencyId}).currencyName){
          throw new Meteor.Error('error', 'error 135');
        }
        try {
          insert = WalletImages.insert({
            _id: md5,
            'currencyId':currencyId,
            'currencyName': Currencies.findOne({_id:currencyId}).currencyName,
            'imageOf': imageOf,
            'createdAt': new Date().getTime(),
            'createdBy': Meteor.user()._id,
            'flags': 0,
            'approved': false
          });
        } catch(error) {
          throw new Meteor.Error('Error', 'That image has already been used on Blockrazor. You must take your own original screenshot.');
        }
        if(insert != md5) {throw new Meteor.Error('Error', 'Something is wrong, please contact help.');}

        fs.writeFile(filename, binaryData, {encoding: 'binary'}, function(error){
            if(error){console.log(error)};
        });
      }
});