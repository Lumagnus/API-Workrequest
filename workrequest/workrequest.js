const Seneca = require('seneca')

const seneca = Seneca();

const workrequests = [];

const states = ["closed","created"]

let maxid = 1;

const workrequest = function (options) {

    this.add('role:wr,cmd:create, applicant:*,work:*,dc_date:*', function (msg, done) {
        let wr = {
            id: maxid,
            applicant: msg.applicant,
            work: msg.work,
            dc_date: msg.dc_date,
            state: 'created'
        }
        maxid++;
        workrequests.push(wr);
        done(null,
            {
                success : true,
                data : [
                    wr
                ]
            }
        );
    });

    this.add('role:wr,cmd:get, id:*', function (msg, done) {
        let wr = workrequests[msg.id - 1];
        done(null,
            {
                success : true,
                data : [
                    wr
                ]
            }
        );
    });
    this.add('role:wr,cmd:get', function (msg, done) {
        done(null,
            {
                success : true,
                data : workrequests
            }
        );
    });

    this.add('role:wr,cmd:get,id:*,work:*,state:*',function (msg,done){
        if(workrequests[msg.id-1].state!=='closed'){
            if(states.indexOf(msg.state)!==-1){
                workrequests[msg.id-1].work = msg.work;
                workrequests[msg.id-1].state = msg.state;
                done(null,
                    {
                        success : true,
                        data : [
                            workrequests[msg.id-1]
                        ]
                    }
                );
            }else{
                done(
                    {
                        success : false,
                        msg : "You must specify a valid state !"
                    }
                );
            }
        }else{
            done(
                {
                    success : false,
                    msg : "You can't modify a closed workrequest !"
                }
            );
        }
    });

    this.add('role:wr,cmd:get,id:*,work:*',function (msg,done){
        if(workrequests[msg.id-1].state!=='closed'){
            workrequests[msg.id-1].work = msg.work;
            done(null,
                {
                    success : true,
                    data : [
                        workrequests[msg.id-1]
                    ]
                }
            );
        }else{
            done(
                {
                    success : false,
                    msg : "You can't modify a closed workrequest !"
                }
            );
        }
    });

    this.add('role:wr,cmd:get,id:*,state:*',function (msg,done){
        if(workrequests[msg.id-1].state!=='closed'){
            if(states.indexOf(msg.state)!==-1){
                workrequests[msg.id-1].state = msg.state;
                done(null,
                    {
                        success : true,
                        data : [
                            workrequests[msg.id-1]
                        ]
                    }
                );
            }else{
                done(
                    {
                        success : false,
                        msg : "You must specify a valid state !"
                    }
                );
            }
        }else{
            done(
                {
                    success : false,
                    msg : "You can't modify a closed workrequest !"
                }
            );
        }
    });

    this.add('role:wr,cmd:delete,id:*', function(msg,done){
        if(workrequests[msg.id-1].state!=='closed'){
            let wr = workrequests.splice(msg.id-1,1)[0];
            done(null,
                {
                    success : true,
                    data : [
                        wr
                    ]
                }
            );
        }else{
            done(
                {
                    success : false,
                    msg : "You can't delete a closed workrequest !"
                }
            )
        }
    })

};

seneca.use(workrequest);

seneca.use('seneca-repl', {port: 10021})