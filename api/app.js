const Seneca = require('seneca')
const SenecaWeb = require('seneca-web')
const Express = require('express')
const seneca = Seneca()
const BodyParser = require('body-parser')


const Routes = [
    {
        pin: 'role:api,target:stats',
        prefix: '/api/wr/stats',
        map: {
            //GET /api/wr/stats/:applicant?
            retrieve: {
                GET: true,
                name: '',
                suffix: '/:applicant?'
            }
        }
    },
    {
        pin: 'role:api,target:wr',
        prefix : '/api/wr',
        map: {
            // POST /api/wr
            create: {
                POST: true,
                name: ''
            },
            // GET /api/wr/:id
            retrieve: {
                GET: true,
                name: '',
                suffix: '/:id?',
                postfix: '/?search=true'
            },
            // PUT /api/wr/:id? (id optionnel pour gérer l'erreur)
            update: {
                PUT: true,
                name: '',
                suffix: '/:id?'
            },
            // DELETE /api/wr/:id
            delete: {
                DELETE: true,
                name: '',
                suffix: '/:id?'
            }
        }
    }
]

seneca.use(SenecaWeb, {
    options: { parseBody: false }, // desactive l'analyseur JSON de Seneca
    routes: Routes,
    context: Express().use(BodyParser.json()),     // utilise le parser d'Express pour lire les donnees
    adapter: require('seneca-web-adapter-express') // des requetes PUT
})

seneca.client({     // ce module enverra les messages wr:*
    port: 4000,     // sur le port 4000 (qui est le port sur lequel le microservice
    pin: 'wr:*'     // wr attend les messages...
})

seneca.client({     // ce module enverra les messages stats:*
    port: 4001,     // sur le port 4001 (qui est le port sur lequel le microservice
    pin: 'stats:*'  // stats attend les messages...
});

seneca.client({     // ce module enverra les messages idx:*
    port: 4002,     // sur le port 4002 (qui est le port sur lequel le microservice
    pin: 'idx:*'    // indexation attend les messages...
});

seneca.add('role:api,target:wr', function (msg, reply) {
    let data = msg.args.body;
    let params = msg.args.params;
    let query = msg.args.query;
    switch(msg.request$.method){
        //Create
        case "POST":
            this.act({wr:'post'},{
                cmd: "create",
                applicant: data.applicant,
                work: data.work,
                dc_date: data.dc_date
            }, reply);
            break;
        //Retrieve
        case "GET":
            //Check if a query is something else than search
            Object.keys(JSON.parse(JSON.stringify(query))).forEach(function(key) {
                if(key!=='search'){
                    reply(
                        {
                            success : false,
                            msg : 'query parameter invalid'
                        }
                    )
                }
            });

            if(params.id !== undefined){

                if(query.search!==undefined){
                    reply(
                        {
                            success : false,
                            msg : 'query not possible with wr_id'
                        }
                    )
                }
                this.act({wr:'get'},{
                    cmd: "retrieve",
                    id : params.id
                }, reply);
            }else{
                if(query.search !== undefined){
                    this.act({idx: 'getFilter'},{
                        cmd: "retrieve",
                        query: query.search
                    }, reply);
                } else {
                    this.act({wr: 'getAll'}, {
                        cmd: "retrieve"
                    }, reply);
                }
            }
            break;
        //Update
        case "PUT":
            if(params.id !== undefined){
                if(data.work!== undefined && data.state !== undefined){
                    this.act({wr:'updateworkandstate'},{
                        cmd: "update",
                        id: params.id,
                        work: data.work,
                        state: data.state
                    },reply);
                }else if(data.work!== undefined){
                    this.act({wr:'updatework'},{
                        cmd:"update",
                        id: params.id,
                        work: data.work
                    },reply);
                }else if(data.state !== undefined){
                    this.act({wr:'updatestate'},{
                        cmd: "update",
                        id: params.id,
                        state: data.state
                    },reply);
                }else{
                    reply(
                        {
                            success:false,
                            msg:"wr not found"
                        }
                    )
                }

            }else{
                reply(
                    {
                        success:false,
                        msg: "wr id not provided"
                    }
                )
            }
            break;
        //Delete
        case "DELETE":
            this.act({wr:'delete'},{
                cmd: "delete",
                id: params.id
            },reply);

            break;
    }

});

seneca.add('role:api,target:stats',function (msg, reply){
    let params = msg.args.params;
    switch(msg.request$.method){
        //Retrieve
        case "GET":
            if(params.applicant !== undefined){
                this.act({stats:'getByApplicant'},{
                    cmd: "retrieve",
                    applicant: params.applicant
                },reply);
            }else{
                this.act({stats:'getAll'},{
                    cmd: "retrieve"
                },reply);
            }
            break;
    }
});


seneca.ready(() => {
    const app = seneca.export('web/context')()
    app.listen(3000)
});
