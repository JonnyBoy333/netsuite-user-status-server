'use strict';

import { default as User, UserModel } from '../models/User';
import { Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';

function formatDate() {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const year = d.getFullYear();
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

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
    // console.log('Body', req.body);

    let update:any = {
        $set: {
            deviceId: req.body.deviceId,
            account: req.body.account,
            logoUrl: req.body.logoUrl,
            lastSeen: req.body.date,
            username: req.body.username
        },
    };
    if (req.body.berganKDV) {
        update.$set.name = req.body.username;
    }
    const search = req.body.berganKDV ?
        { name: req.body.username } :
        { deviceId: req.body.deviceId };

    const options = {
        returnNewDocument: true,
        upsert: req.body.username ? true : false
    };
    
    const todaysDate = formatDate();
    // console.log('Todays Date', todaysDate);
    User.findOneAndUpdate(search, update, options, (err, existingUser: any) => {
        if (err) { console.error(err); }
        // console.log('Updated Account', existingUser);
        
        // Increment the hits
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
                .then((users: any) => {
                    if (users.length > 0) {
                        const updatedUsers = users.map((user) => {
                            const hits = user.hits.filter(hit => hit.date === todaysDate);
                            const newUser = {
                                deviceId: user.deviceId,
                                account: user.account,
                                logoUrl: user.logoUrl,
                                lastSeen: user.lastSeen,
                                username: user.username,
                                name: user.name,
                                hits: hits.length > 0 ? hits[0].number : 0,
                                active: user.name === existingUser.name
                            };
                            return newUser;
                        });
                        console.log('Users', users.map(user => user.name));
                        res.send(updatedUsers);
                    }
                });
        });
    });
};

/**
 * GET /api
 * Retrieve a list of packages
 */
export let getUsers = (req: Request, res: Response) => {
    const deviceId = req.query.deviceId;
    console.log('Device ID', deviceId);
    User.find({})
    .then((users: any) => {
        if (users.length > 0) {
            const todaysDate = formatDate();
            const updatedUsers = users.map((user) => {
                const hits = user.hits.filter(hit => hit.date === todaysDate);
                const newUser = {
                    deviceId: user.deviceId,
                    account: user.account,
                    logoUrl: user.logoUrl,
                    lastSeen: user.lastSeen,
                    name: user.name,
                    username: user.username,
                    hits: hits.length > 0 ? hits[0].number : 0,
                    active: user.deviceId === deviceId
                };
                return newUser;
            });
            console.log('Users', users.map(user => user.name));
            res.send(updatedUsers);
        }
    });
};
