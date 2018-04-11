'use strict';

import { default as User, UserModel } from '../models/User';
import { Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';

/**
 * POST /api
 * Create a new account
 */
export let createUpdateAccount = (req: Request, res: Response, next: NextFunction) => {

    const errors = req.validationErrors();

    if (errors) {
        console.log('Error updating an account', errors);
        return res.send(errors);
    }
    console.log('Body', req.body);

    function formatDate() {
        const d = new Date();
        const year = d.getFullYear();
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
    
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
    
        return [year, month, day].join('-');
    }

    let update:any = {
        $set: {
            deviceId: req.body.deviceId,
            account: req.body.account,
            logoUrl: req.body.logoUrl,
            lastSeen: req.body.date,
        },
    };
    if (req.body.username) {
        update.$set.name = req.body.username;
    }
    const search = {
        deviceId: req.body.deviceId
    };
    const options = {
        returnNewDocument: true,
        upsert: req.body.username ? true : false
    };
    
    const todaysDate = formatDate();
    User.findOneAndUpdate(search, update, options, (err, existingUser: any) => {
        if (err) { return next(err); }
        console.log('Updated Account', existingUser.name);
        
        // Increment the hits
        if (req.body.from === 'interval') {
            // console.log('Todays Date', todaysDate);
            const dateIndex = existingUser.hits.map(hit => hit.date).indexOf(todaysDate);
            options.upsert = false;
            if (dateIndex >= 0) {
                update = { $inc: { 'hits.$.number' : 1 } };
                search['hits.date'] = todaysDate;
            } else {
                update = { $push: { hits: { date: todaysDate, number: 1 } } };
            }
            // console.log('Search', search);
            // console.log('Update', update);
            // console.log('options', options);
            User.findOneAndUpdate(search, update, options, (err, updatedUser) => {
                if (err) console.log('Error', err);
                // console.log('updated user', updatedUser);
                User.find({})
                .then((users) => {
                    if (users.length > 0) {
                        const userNames = users.map(user => (<any>user).name);
                        console.log('Users', userNames);
                        res.send(userNames);
                    }
                });
            });
        } else {
            User.find({})
            .then((users: any) => {
                if (users.length > 0) {
                    console.log('Users', users.map(user => user.name));
                    const updatedUsers = users.map((user) => {
                        const hits = user.hits.filter(hit => hit.date === todaysDate);
                        const newUser = {
                            deviceId: user.deviceId,
                            account: user.account,
                            logoUrl: user.logoUrl,
                            lastSeen: user.lastSeen,
                            name: user.name,
                            hits: hits.length > 0 ? hits[0].number : 0,
                            active: user.name === existingUser.name
                        };
                        return newUser;
                    });
                    // console.log('Updated Users', updatedUsers);
                    res.send(updatedUsers);
                }
            });
        }
    });
};

/**
 * GET /api
 * Retrieve a list of packages
 */
export let getUsers = (req: Request, res: Response) => {
    User.find({})
    .then((users) => {
        if (users.length > 0) {
            console.log('Users', users.map(user => user.name));
            const updatedUsers = users.map((user) => {
                const hits = user.hits.filter(hit => hit.date === todaysDate);
                const newUser = {
                    deviceId: user.deviceId,
                    account: user.account,
                    logoUrl: user.logoUrl,
                    lastSeen: user.lastSeen,
                    name: user.name,
                    hits: hits.length > 0 ? hits[0].number : 0
                };
                return newUser;
            });
            // console.log('Updated Users', updatedUsers);
            res.send(updatedUsers);
        }
    });
};
