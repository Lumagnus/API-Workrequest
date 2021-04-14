const Seneca = require('seneca')

const seneca = Seneca();

const workrequests = [];

const states = ["closed","created"]

const findWRByID = function(id){
    for(let i = 0; i<workrequests.length;i++){
        if(workrequests[i].id==id){
            return workrequests[i];
        }
    }
    return undefined;
}

//Function taken from the client_iteration2.js test file
function currentDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    return today;
}

const workrequest = function (options) {
    let maxid = 1;

    this.add('wr:post', function (msg, done) {
        if(msg.dc_date !== undefined && msg.applicant !== undefined && msg.work !== undefined){
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
        }else{
            done(
                {
                    success : false,
                    msg : "Not enough arguments, 3 expected"
                })
        }

    });

    this.add('wr:get', function (msg, done) {
        if(msg.id !== undefined){
            let wr = findWRByID(msg.id);
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
                    msg : "Not Found"
                }
            )
        }

    });
    this.add('wr:getAll', function (msg, done) {
        done(null,
            {
                success : true,
                data : workrequests
            }
        );
    });

    this.add('wr:updateworkandstate',function (msg,done){
        let wr = findWRByID(msg.id);
        let index = workrequests.indexOf(wr);
        console.log(JSON.stringify(wr));

        if (wr!== undefined){
            if(wr.state!=='closed'){
                if(states.indexOf(msg.state)!==-1){
                    if(msg.state==="closed"){
                        workrequests[index].compl_date = currentDate();
                    }
                    workrequests[index].work = msg.work;
                    workrequests[index].state = msg.state;
                    console.log("WR Updated : " + workrequests)
                    done(null,
                        {
                            success : true,
                            data : [
                                workrequests[index]
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
                        msg : "wr is already closed"
                    }
                );
            }
        }else{
            done(
                {
                    success : false,
                    msg : "wr not found"
                }
            )
        }

    });

    this.add('wr:updatework',function (msg,done){
        console.log("Find by ID from update")
        let wr = findWRByID(msg.id);
        let index = workrequests.indexOf(wr);
        console.log(JSON.stringify(wr));

        if(wr!== undefined){
            if(wr.state!=='closed'){
                workrequests[index].work = msg.work;
                console.log("WR Updated : " + workrequests)

                done(null,
                    {
                        success : true,
                        data : [
                            workrequests[index]
                        ]
                    }
                );
            }else{
                done(
                    {
                        success : false,
                        msg : "wr is already closed"
                    }
                );
            }
        }else{
            done(
                {
                    success : false,
                    msg : "wr not found"
                }
            )
        }
    });

    this.add('wr:updatestate',function (msg,done){
        console.log("Find by ID from update")

        let wr = findWRByID(msg.id);
        let index = workrequests.indexOf(wr);
        console.log(JSON.stringify(wr));


        if(wr!== undefined){
            if(wr.state!=='closed'){
                if(states.indexOf(msg.state)!==-1){
                    if(msg.state==="closed"){
                        workrequests[index].compl_date = currentDate();
                    }
                    workrequests[index].state = msg.state;
                    console.log("WR Updated : " + workrequests)
                    done(null,
                        {
                            success : true,
                            data : [
                                workrequests[index]
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
                        msg : "wr is already closed"
                    }
                );
            }
        }else{
            done(
                {
                    success : false,
                    msg : "wr not found"
                }
            )
        }
    });

    this.add('wr:delete', function(msg,done){
        if(msg.id!==undefined){
            let wr = findWRByID(msg.id);
            let index = workrequests.indexOf(wr);
            if (wr !== undefined){
                if(workrequests[msg.id-1].state!=='closed'){
                    workrequests.splice(index,1);
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
                            msg : "wr is already closed"
                        }
                    )
                }
            }else{
                done(
                    {
                        success : false,
                        msg : "wr not found"
                    }
                )
            }
        }else{
            let closedWR = []
            for(let i = 0; i<workrequests.length;i++){
                if(workrequests[i].state==='closed'){
                    closedWR.push(workrequests[i]);
                }
            }
            let deletedWR = workrequests.splice(0,workrequests.length);
            workrequests.push(closedWR);
            done(null,
                {
                    success : true,
                    data : deletedWR
                }
            );
        }


    })

};

seneca.use(workrequest);

seneca.listen(4000)
