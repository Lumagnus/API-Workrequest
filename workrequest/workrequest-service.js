const Seneca = require('seneca')

const seneca = Seneca();

const workrequests = [];

const deletedWorkRequest = [];

const states = ["closed","created"];

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

const workrequestService = function (options) {
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
            if(wr !== undefined){
                if(wr.state!=='deleted'){
                    done(null,
                        {
                            success : true,
                            data : [
                                wr
                            ]
                        }
                    );
                }
            }
        }
        done(
            {
                success : false,
                msg : "wr not found"
            }
        );
    });
    this.add('wr:getAll', function (msg, done) {
        let onlyNotDeletedWR = []
        for(let i = 0; i<workrequests.length; i++){
            if(workrequests[i].state!=='deleted'){
                onlyNotDeletedWR.push(workrequests[i])
            }
        }
        done(null,
            {
                success : true,
                data : onlyNotDeletedWR
            }
        );
    });

    this.add('wr:updateworkandstate',function (msg,done){
        let wr = findWRByID(msg.id);
        let index = workrequests.indexOf(wr);

        if (wr!== undefined){
            if(wr.state!=='closed' && wr.state!=='deleted'){
                if(states.indexOf(msg.state)!==-1){
                    if(msg.state==="closed"){
                        workrequests[index].compl_date = currentDate();
                    }
                    workrequests[index].work = msg.work;
                    workrequests[index].state = msg.state;
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
        let wr = findWRByID(msg.id);
        let index = workrequests.indexOf(wr);

        if(wr!== undefined){
            if(wr.state!=='closed' && wr.state!=='deleted'){
                workrequests[index].work = msg.work;

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

        let wr = findWRByID(msg.id);
        let index = workrequests.indexOf(wr);


        if(wr!== undefined){
            if(wr.state!=='closed' && wr.state!=='deleted'){
                if(states.indexOf(msg.state)!==-1){
                    if(msg.state==="closed"){
                        workrequests[index].compl_date = currentDate();
                    }
                    workrequests[index].state = msg.state;
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
            let cloneWR = { ...wr}
            let index = workrequests.indexOf(wr);
            if (wr !== undefined){
                if(workrequests[index].state!=='closed'){
                    workrequests[index].state='deleted';
                    done(null,
                        {
                            success : true,
                            data : [
                                cloneWR
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
            for(let i = 0; i<workrequests.length;i++){
                if(workrequests[i].state!=='closed'){
                    workrequests[i].state='deleted';
                }
            }
            done(null,
                {
                    success : true,
                    data : []
                }
            );
        }


    })

    this.add('wr:getAllEvenDeleted',function(msg,done){
        done(null,
            {
                success : true,
                data : workrequests
            }
        );
    });

};

seneca.use(workrequestService);

seneca.listen(4000)
