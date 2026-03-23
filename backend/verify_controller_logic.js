const GuideController = require('./api/controllers/GuideController');

console.log('--- Verifying GuideController.upload Logic ---');

const req = {
    user: { id: 'test-user' }
};

const res = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        this.body = data;
        return this;
    }
};

async function test() {
    await GuideController.upload(req, res);
    
    console.log('Status code:', res.statusCode);
    console.log('Response body:', res.body);

    if (res.statusCode === 501 && res.body.success === false) {
        console.log('\n\x1b[32m%s\x1b[0m', 'SUCCESS: GuideController.upload logic verified (returns 501).');
    } else {
        console.log('\n\x1b[31m%s\x1b[0m', 'FAILURE: Unexpected controller behavior.');
        process.exit(1);
    }
}

test();
