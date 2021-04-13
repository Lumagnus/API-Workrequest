const Seneca = require('seneca')
const SenecaWeb = require('seneca-web')
const Express = require('express')
const seneca = Seneca()
const BodyParser = require('body-parser')


var Routes = [{
    // envoie le message counter:inc a la reception d'une requete HTTP
    // de type PUT sur l'URL http://localhost:3000/counter/inc
    pin: 'counter:inc',
    prefix : '/counter',
    map: {
        inc: {
            PUT: true
        }
    }
},
    {
        // envoie le message counter:dec a la reception d'une requete HTTP
        // de type PUT sur l'URL http://localhost:3000/counter/dec
        pin: 'counter:dec',
        prefix : '/counter',
        map: {
            dec: {
                PUT: true
            }
        }
    }]


// definition d'une route /counter accessible via des requetes PUT
var Routes = [{
    pin: 'role:web,target:counter', // type de message cree a la reception d'une requete HTTP
    prefix : '/counter',
    map: {
        op: {
            PUT: true, // accepte uniquement les requetes PUT
            name: '', // pour ne pas creer une route /counter/op
                      // cf. https://github.com/senecajs/seneca-web/blob/master/docs/providing-routes.md
        }
    }
}]

seneca.use(SenecaWeb, {
    options: { parseBody: false }, // desactive l'analyseur JSON de Seneca
    routes: Routes,
    context: Express().use(BodyParser.json()),     // utilise le parser d'Express pour lire les donnees
    adapter: require('seneca-web-adapter-express') // des requetes PUT
})

seneca.client({      // ce module enverra les messages counter:*
    port: 4000,      // sur le port 4000 (qui est le port sur lequel le microservice
    pin: 'counter:*' // counter attend les messages...
})

// cette fonction permet de transformer des messages role:web,target:counter :
// - soit en message counter:inc si la donnee op === inc
// - soit en message counter:decf si la donnee op === dec
seneca.add('role:web,target:counter', function (msg, respond) {
    let data = msg.args.body;
    let params = msg.args.params;
    console.log('add target:counter : ' + data.op);

    this.log.info({pattern: msg.args.route.pattern, data: data, params: params});

    if (data.op === 'inc') {
        this.act('counter:inc', respond);
    } else if (data.op === 'dec') {
        this.act('counter:dec', respond);
    } else respond(new Error("Invalid op"))

})

// les requetes HTTP sont attendues sur le port 3000
// Pour tester :
// - lancer le service counter.js
// - lancer la passerelle RESTcounter.js
// - et tester avec : curl -H "Content-Type: application/json" -d '{"op":"inc"}' -X PUT http://localhost:3000/counter

seneca.ready(() => {
    const app = seneca.export('web/context')()
    app.listen(3000)
})
