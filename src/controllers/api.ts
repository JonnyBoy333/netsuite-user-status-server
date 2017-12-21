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
    const domain = 'luxerlockerapp.com';
    const mailgun = require('mailgun-js')({ domain, apiKey });
 
    const data = {
        from: 'mail@luxerlockerapp.com',
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
    if (subject.toLowerCase().indexOf('confirm') >= 0) {
        function extractEmails(text: string) {
            return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
        }
        const emails = extractEmails(subject);
        console.log('Email', emails[0]);

        // Send the emails back
        forwardEmail(emails[0], req.body);
    } else {
        const html = req.body['body-html'];
        if (!html) res.send('Not Successful');
        const email = req.body.To;
        console.log('Sender email:', email);
        const $ = cheerio.load(html);
        
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
