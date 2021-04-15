const Seneca = require('seneca')

const seneca = Seneca();


const stats = function(options){
    this.add('stats:getByApplicant', function (msg, done) {
        let data = {
            stats_wr_created: 0,
            stats_wr_opened: 0,
            stats_wr_closed: 0,
            applicant: msg.applicant
        };
        this.act({wr:'getAllEvenDeleted'},{
            cmd: 'retrieve'
        },function(err, response){
            if(response.success){
                for(let i=0; i<response.data.length;i++){
                    if(response.data[i].applicant===msg.applicant){
                        if(response.data[i].state==='created'){
                            data.stats_wr_created++;
                            data.stats_wr_opened++;
                        }else if(response.data[i].state==='closed'){
                            data.stats_wr_created++;
                            data.stats_wr_closed++;
                        }else if(response.data[i].state==='deleted'){
                            data.stats_wr_created++;
                        }
                    }
                }
                done(null,
                    {
                        success: true,
                        data: data
                    }
                )
            }
        })

    });
    this.add('stats:getAll', function (msg, done) {
        let data = {
            global_stats_wr_created: 0,
            global_stats_wr_opened: 0,
            global_stats_wr_closed: 0
        };
        this.act({wr:'getAllEvenDeleted'},{
            cmd: 'retrieve'
        },function(err, response){
            if(response.success){

                for(let i=0; i<response.data.length;i++){
                    if(response.data[i].state==='created'){
                        data.global_stats_wr_created++;
                        data.global_stats_wr_opened++;
                    }else if(response.data[i].state==='closed'){
                        data.global_stats_wr_created++;
                        data.global_stats_wr_closed++;
                    } else if(response.data[i].state==='deleted'){
                        data.global_stats_wr_created++;
                    }
                }
                done(null,
                    {
                        success: true,
                        data: data
                    }
                )
            }
        })

    });

}

seneca.use(stats)

seneca.listen(4001);
seneca.client({port:4000, pin: 'wr:*'});