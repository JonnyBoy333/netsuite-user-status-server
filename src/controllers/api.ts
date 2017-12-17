'use strict';

// import * as async from 'async';
// import * as request from 'request';
// import * as graph from 'fbgraph';
import { default as User, UserModel } from '../models/User';
import { default as Package, PackageModel } from '../models/Package';
import { Request, Response, NextFunction } from 'express';
import * as cheerio from 'cheerio';

/**
 * POST /api
 * Create a new account
 */
export let createAccount = (req: Request, res: Response, next: NextFunction) => {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password must be at least 4 characters long').len({ min: 4 });
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
    req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

    const errors = req.validationErrors();

    if (errors) {
        console.log('Error creating an account', errors);
        return res.send(errors);
    }

    const user = new User({
        email: req.body.email,
        password: req.body.password,
        profile: {
            first_name: req.body.first_name,
            last_name: req.body.last_name
        }
    });

    User.findOne({ email: req.body.email }, (err, existingUser) => {
        if (err) { return next(err); }
        if (existingUser) {
            return res.send({ msg: 'Account with that email address already exists.' });
        }
        user.save((err: Error, newUser: UserModel) => {
            if (err) { return next(err); }
            res.send({ msg: `Account ${newUser.email} created successfully` });
            console.log(`Account ${newUser._id} created successfully`);
        });
    });
};

function forwardEmail(toEmail: string, emailObj: any) {
    const apiKey = 'key-1629b1cbb5e665bb4519e54de96311bd';
    const domain = 'www.luxerlockerapp.com';
    const mailgun = require('mailgun-js')({ domain, apiKey });
 
    const data = {
        from: emailObj.from,
        to: toEmail,
        subject: emailObj.subject,
        text: emailObj['body-plain'],
        html: emailObj['stripped-html']
    };
 
    mailgun.messages().send(data, (error: object, body: object) => {
        console.log(body);
    });
}

/**
 * POST /api
 * Create a new package
 */
export let createPackage = (req: Request, res: Response, next: NextFunction) => {
    console.log('Body:', JSON.stringify(req.body, null, 4));

    // Send back confirmation emails
    const subject = req.body.subject;
    const html = req.body['body-html'];
    if (subject.toLowerCase().indexOf('confirm') >= 0) {
        function extractEmails(text: string) {
            return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
        }
        const emails = extractEmails(subject);

        // Send the emails back
        forwardEmail(emails[0], req);
    } else {
        console.log('Body:', JSON.stringify(req.body, null, 4));
        const html = req.body['body-html'];
        if (!html) res.send('Not Successful');
        const email = req.body.sender;
        console.log('Sender email:', email);
        const $ = cheerio.load(html);
        // const $ = cheerio.load('<html xmlns="http://www.w3.org/1999/xhtml">\r\n<head>\r\n<title></title>\r\n</head>\r\n<body>\r\n<div name="messageBodySection" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;"><br /></div>\r\n<div name="messageReplySection" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;"><br />\r\n<blockquote type="cite" style="margin: 5px 5px; padding-left: 10px; border-left: thin solid #1abc9c;">\r\n<div style="margin: 0 auto; background: #000000;">\r\n<div style="margin: 0 auto; background: #000000; padding-bottom: 50px; max-width: 600px;">\r\n<table style="border: 0px solid black; font-family: \'HelveticaNeue\';" width="600px" cellspacing="5" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td style="border: 0px solid black; font-family: \'HelveticaNeue\'; padding: 5px; text-align: center;">\r\n<div class="logo" style="float: left; padding: 5px 0px 0px 5px;"><img src="https://app.luxerone.com/img/l1-logo.png" alt="" width="128" /></div>\r\n</td>\r\n<td style="border: 0px solid black; font-family: \'HelveticaNeue\'; text-align: right;" valign="bottom">\r\n<ul class="rightColumn" style="font-size: 14px; padding-left: 0px; line-height: 200%;">\r\n<li class="active" style="-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; list-style-type: none; text-transform: uppercase; text-decoration: none;"><a style="-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; list-style-type: none; text-transform: uppercase; text-decoration: underline; color: #ffffff;" href="https://app.luxerone.com/account/edit">View Profile</a></li>\r\n<li style="-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; list-style-type: none; text-transform: uppercase; text-decoration: none;"><a style="-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; list-style-type: none; text-transform: uppercase; text-decoration: underline; color: #ffffff;" href="http://luxerone.com/residents/faqs">FAQs</a></li>\r\n</ul>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table style="border: 3px solid #fed666; width: 98%; margin: 5px auto; font-family: HelveticaNeue; background: #ffffff; text-align: center;" width="600px" align="center">\r\n<tbody>\r\n<tr>\r\n<td class="image-3" style="border: 0px solid black; font-family: \'HelveticaNeue\'; padding: 5px; text-align: center;" valign="top">\r\n<h3 style="color: #feb612; text-align: center; font-family: \'HelveticaNeue\'; margin-top: 13px; font-size: 16px; margin-bottom: 9px;">ENTER ACCESS CODE</h3>\r\n<table align="center">\r\n<tbody>\r\n<tr>\r\n<td style="width: 227px; height: 227px; margin-right: 20px; border: 2px solid #feb612; text-align: center; color: #585858; font-size: 50px; font-weight: bold;">770074</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n<td class="image-2" style="border: 0px solid black; font-family: \'HelveticaNeue\'; padding: 5px; text-align: center; padding-top: 30px; font-size: 200%; font-style: bold;">OR</td>\r\n<td class="image-1" style="border: 0px solid black; font-family: \'HelveticaNeue\'; padding: 5px; text-align: center;">\r\n<h3 style="color: #feb612; text-align: center; font-family: \'HelveticaNeue\'; margin-top: 13px; font-size: 16px; margin-bottom: 9px;">SCAN QR CODE</h3>\r\n<table align="center">\r\n<tbody>\r\n<tr>\r\n<td style="margin-left: 20px; border: 2px solid #feb612; align: center; width: 227px; height: 227px;"><img style="width: 227px; height: 227px;" src="https://app.luxerone.com/deliveries/qrcode/6568548/2fa18244bca6a3e15d5e9a5b4edc22f8bb88c0ab" alt="" /></td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n<tr>\r\n<td style="border: 0px solid black; font-family: \'HelveticaNeue\'; padding: 5px; text-align: left;" colspan="3">\r\n<p class="cont" style="color: #585858; font-size: 17px; font-family: \'HelveticaNeue\'; text-align: left; padding-left: 20px; line-height: 24px;">Dear Jon,<br />\r\n<br /></p>\r\n<p class="cont" style="color: #585858; font-size: 17px; font-family: \'HelveticaNeue\'; text-align: left; padding-left: 20px; line-height: 24px;">Great news! Your package is here! Whenever you\'re ready, go to the Luxer One lockers in your building, enter theaccess code <strong>770074</strong> and your package will be there, safe and sound and waiting for you. After you take your package, don\'t forget to shut the door!<br />\r\n<br />\r\nLocker Location: Phase 1 - 2837 Dupont Ave., located outside of the mail room.<br />\r\nAddress: 2835 Dupont Ave South<br />\r\nUnit: N229<br />\r\n<br />\r\nHere is a picture of the label:</p>\r\n<p><img width="500" src="https://luxer.s3.amazonaws.com/pictures/477/6568548/label_1511051204_2270323289.jpg" alt="Label Picture" /></p>\r\n<p class="cont" style="color: #585858; font-size: 17px; font-family: \'HelveticaNeue\'; text-align: left; padding-left: 20px; line-height: 24px;">Thanks so much for using Luxer One! No need to rush home. Your package will be ready when you are!<br />\r\n<br />\r\nNeed assistance or have a question about a package? Email us at <a href="mailto:support@luxerone.com">support@luxerone.com</a> or call (415) 390-0123.</p>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table style="border: 0px solid black; font-family: HelveticaNeue; height: 140px;" width="600px">\r\n<tbody>\r\n<tr>\r\n<td style="border: 0px solid black; font-family: \'HelveticaNeue\'; padding: 5px; text-align: center;">\r\n<p class="end-text" style="color: #fff; font-size: 13px; font-family: \'HelveticaNeue\'; text-align: center; line-height: 24px;"><a style="color: #a9a9a9;" href="https://app.luxerone.com/account/edit">Click here</a> to update your notification settings</p>\r\n<a href="www.luxerone.com"><img src="http://luxerone.com/wp-content/uploads/2017/01/Powered-By-Luxer-One-Logo.png" alt="" /></a></td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</div>\r\n</blockquote>\r\n</div>\r\n</body>\r\n</html>\r\n');
        
        // Parse the message for relevent data
        const accessCode = $('td.image-3>table>tbody>tr>td').text();
        const qrImage = $('td.image-1>table>tbody>tr>td>img').attr('src');
        const bodyText = $('p.cont').eq(1).html().split('<br>');
        const lockerLocation = bodyText[2].substr(bodyText[2].indexOf('Locker Location:') + 'Locker Location:'.length).trim();
        const address = bodyText[3].substr(bodyText[3].indexOf('Address:') + 'Address:'.length).trim();
        const unit = bodyText[4].substr(bodyText[4].indexOf('Unit:') + 'Unit:'.length).trim();
        const labelPicture = $('img[alt="Label Picture"]').attr('src');
    
        const luxerPackage = new Package({
            address,
            unit,
            accessCode,
            qrImage,
            lockerLocation,
            labelPicture,
        });
    
        // Save the new package and add the the user
        User.findOne({ email }, (err, existingUser) => {
            if (err) return next(err);
            if (!existingUser) return res.send({ msg: 'Account is not setup yet.' });
    
            // Create the new package
            luxerPackage.save((err: Error, updatedPackage: PackageModel) => {
                if (err) { return next(err); }
                console.log(`Package ${updatedPackage._id} saved successfully.`);
                res.send({ msg: `Package ${updatedPackage.accessCode} saved successfully.` });
            })
    
            // Update the User with the new package
            .then((newPackage) => {
                const update = { $addToSet : { packages : newPackage._id } };
                const search = { email };
                const options = { new: true };
                User.findOneAndUpdate(search, update, options).exec()
                .then((updatedUser: UserModel) => {
                    console.log('Updated User', updatedUser.email);
                });
            });
        });
    }
};

/**
 * GET /api
 * Retrieve a package
 */
export let getPackage = (req: Request, res: Response) => {
    const packageId = req.params.id;
    if (!packageId) {
        return res.send({ msg: 'Please specify a package ID.' });
    }
    Package.find({ _id: packageId }, (err: Error, luxerPackage: PackageModel) => {
        if (err) res.send({ msg: err });
        if (!luxerPackage) res.send({ msg: 'Package does not exist' });
        else res.send(luxerPackage);
    });
};

/**
 * GET /api
 * Retrieve a list of packages
 */
export let getPackages = (req: Request, res: Response) => {
    User.findOne({ email: req.params.email }, (err: Error, foundUser: UserModel) => {
        if (err) {
            return res.send({ msg: 'The user does not exist.' });
        }
        if (!foundUser) {
            return res.send({ msg: 'User not found' });
        }
        const packageIds = foundUser.packages;
        Package.find({ _id: [packageIds] })
        .then((packages) => {
            res.send(packages);
        });
    });
};

/**
 * DELETE /api
 * Delete a package
 */
export let deletePackage = (req: Request, res: Response) => {
    const packageId = req.body.id;
    const email = req.body.email;
    Package.findOneAndRemove({ _id: packageId }, (err: Error, luxerPackage: PackageModel) => {
        if (err) return res.send({ msg: err });
        if (!luxerPackage) return res.send({ msg: 'Package not found' });
        res.send({ msg: `${luxerPackage.accessCode } has been successfully deleted.` });
        User.findOneAndUpdate({ email }, { $pull: { packages: luxerPackage._id } }, (err: Error, updatedUser: UserModel) => {
            if (err) {
                console.log('Error updated the user', err);
            } else {
                console.log(`User ${updatedUser.email} updated.`);
            }
        });
    });
};
/**
 * GET /api/facebook
 * Facebook API example.
 */
// export let getFacebook = (req: Request, res: Response, next: NextFunction) => {
//     const token = req.user.tokens.find((token: any) => token.kind === 'facebook');
//     graph.setAccessToken(token.accessToken);
//     graph.get(`${req.user.facebook}?fields=id,name,email,first_name,last_name,gender,link,locale,timezone`, (err: Error, results: graph.FacebookUser) => {
//         if (err) { return next(err); }
//         res.render('api/facebook', {
//             title: 'Facebook API',
//             profile: results
//         });
//     });
// };
