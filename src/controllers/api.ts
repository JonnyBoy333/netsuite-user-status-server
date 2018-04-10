'use strict';

import { default as User, UserModel } from '../models/User';
import { Request, Response, NextFunction } from 'express';

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

    const update:any = {
        $set: {
            deviceId: req.body.deviceId,
            account: req.body.account,
            logoUrl: req.body.logoUrl,
            lastSeen: req.body.date
        },
        $inc: {
            'hits.$[element].number': 1
        }
        // $addToSet: { 
        //     hits: {
        //         date: formatDate(),
        //         hits: 1
        //     }
        // }
    };
    if (req.body.username) {
        update.$set.name = req.body.username;
    }
    const search = {
        deviceId: req.body.deviceId
    };
    const options = {
        returnNewDocument: true,
        upsert: req.body.username ? true : false,
        arrayFilters: [{ 'element.date': formatDate() }]
    };

    User.findOneAndUpdate(search, update, options, (err, existingUser) => {
        if (err) { return next(err); }
        console.log('Updated Account', (<any>existingUser).name);
        User.find({})
        .then((users) => {
            console.log('Users', users.map(user => (<any>user).name));
            res.send(users);
        });
    });
};

/**
 * GET /api
 * Retrieve a list of packages
 */
export let getUsers = (req: Request, res: Response) => {
    User.find({})
    .then((users) => {
        console.log('Users', users);
        res.send(users);
    });
};
