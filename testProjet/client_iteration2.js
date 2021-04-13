'use strict'

const {expect} = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Restify = require('restify-clients');

const client = Restify.createJsonClient({
    url: 'http://localhost:3000'
});

// test data...
let paulWR = {
    applicant: "paul",
    work: "PC update",
    dc_date: "05/06/2021"
};

let pierreWR = {
    applicant: "pierre",
    work: "PC configuration",
    dc_date: "07/05/2021"
};

let henriWR = {
    applicant: "henry",
    work: "Hard disk installation",
};

let jacquesWR = {
    work: "PC installation",
    dc_date: "21/05/2021"
};

// to make asynchronous calls
function makePromiseRequest(request, route, arg) {
    var args = [route];
    var i = 1;
    // the number of arguments depends on the type of the request (only for POST and PUT)
    if (arg !== undefined) {
        args[1] = arg
        i++;
    }
    return new Promise(resolve => {
        args[i] = (err, req, res, result) => {
            resolve(result);
        };
        request.apply(client, args);
    });
}

// build current date
function currentDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    return today;
}

lab.experiment('work request app', () => {

    // delay between each test (if necessary)
    /*
    lab.beforeEach(() => {

        return new Promise( (resolve) => {
            // Wait 50 ms
            setTimeout( () => { resolve(); }, 50);
        });
    });
    */

    // 1
    lab.test('create a workrequest for paul', async () => {
        const result = await makePromiseRequest(client.post, '/api/workrequest', paulWR);
        expect(result).to.not.be.null();
        expect(result.success).to.be.true();
        // for creation (post) we use 'include' because fields are added
        expect(result.data[0]).to.include(paulWR);
        expect(result.data[0].id).to.not.be.undefined();
        expect(result.data[0].state).to.be.equals('created');
        // completion date doesn't exist because workrequest isn't closed
        expect(result.data[0].compl_date).to.not.exist();
        paulWR = result.data[0]; // for next tests...
    });

    // 2
    lab.test('get w/ id', async () => {
        const result = await makePromiseRequest(client.get, '/api/workrequest/' + paulWR.id);
        expect(result.success).to.be.true();
        expect(result.data[0]).to.be.equals(paulWR);
        // completion date doesn't exist because workrequest isn't closed
        expect(result.data[0].compl_date).to.not.exist();
    });

    // 3
    lab.test('update work item', async () => {
        let newWorkItem = 'PC reinstall';
        const result = await makePromiseRequest(client.put, '/api/workrequest/' + paulWR.id, {"work": newWorkItem});
        expect(result.success).to.be.true();
        paulWR.work = newWorkItem;
        expect(result.data[0]).to.be.equals(paulWR);
        // completion date doesn't exist because workrequest isn't closed
        expect(result.data[0].compl_date).to.not.exist();
    });

    // 4
    lab.test('update state (closing)', async () => {
        const result = await makePromiseRequest(client.put, '/api/workrequest/' + paulWR.id, {"state": "closed"});
        expect(result.success).to.be.true();
        paulWR.state = 'closed';
        paulWR.compl_date = currentDate();
        expect(result.data[0]).to.be.equals(paulWR);
    });

    // 5
    lab.test('attempt to update a closed workrequest', async () => {
        const result = await makePromiseRequest(client.put, '/api/workrequest/' + paulWR.id, {"work": "PC reinstall"});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('workrequest is already closed');
    });

    // 6
    lab.test('attempt to delete a closed workrequest', async () => {
        const result = await makePromiseRequest(client.del, '/api/workrequest/' + paulWR.id);
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('workrequest is already closed');
    });

    // 7
    lab.test('create a workrequest for pierre', async () => {
        const result = await makePromiseRequest(client.post, '/api/workrequest', pierreWR);
        expect(result.success).to.be.true();
        expect(result.data[0]).to.include(pierreWR);
        // completion date doesn't exist because workrequest isn't closed
        expect(result.data[0].compl_date).to.not.exist();
        pierreWR = result.data[0];
    });

    // 8
    lab.test('get all WR (w/o id)', async () => {
        const result = await makePromiseRequest(client.get, '/api/workrequest');
        expect(result.success).to.be.true();
        // tests inclusion in both directions to determine equality
        expect(result.data).to.include([paulWR, pierreWR]);
        expect([paulWR, pierreWR]).to.include(result.data);
    });

    // 9
    lab.test('delete an opened workrequest', async () => {
        const result = await makePromiseRequest(client.del, '/api/workrequest/' + pierreWR.id);
        expect(result.success).to.be.true();
        expect(result.data[0]).to.be.equals(pierreWR);
    });

    // 10
    lab.test('attempt to update a dummy workrequest', async () => {
        const result = await makePromiseRequest(client.put, '/api/workrequest/_______', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('workrequest not found');
    });

    // 11
    lab.test('attempt to update a workrequest w/o id', async () => {
        const result = await makePromiseRequest(client.put, '/api/workrequest', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('workrequest id not provided');
    });

    // 12
    lab.test('attempt to delete a dummy workrequest', async () => {
        const result = await makePromiseRequest(client.del, '/api/workrequest/_______');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('workrequest not found');
    });

    // 13
    lab.test('create a (bad) workrequest for henry', async () => {
        const result = await makePromiseRequest(client.post, '/api/workrequest', henriWR);
        expect(result).to.not.be.null();
        // dc_date is missing and this should trigger an error
        expect(result.success).to.be.false();
    });

    // 14
    lab.test('create a (bad) workrequest for jacques', async () => {
        const result = await makePromiseRequest(client.post, '/api/workrequest', jacquesWR);
        expect(result).to.not.be.null();
        // applicant is missing and this should trigger an error
        expect(result.success).to.be.false();
    });
});

