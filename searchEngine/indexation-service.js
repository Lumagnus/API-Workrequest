const Seneca = require('seneca')

const seneca = Seneca();

const MiniSearch = require('minisearch')

const index = function(options){
    this.add("idx:getFilter", function(msg,done){
            this.act({wr:'getAll'},{
                cmd:'retrieve'
            }, function(err, response){
                if(response.success){
                    let minisearch = new MiniSearch({
                        fields:['applicant', 'work', 'dc_date', 'state', 'compl_date'],
                        storeFields: [ 'id', 'applicant', 'work', 'dc_date', 'state', 'compl_date']
                    });
                    minisearch.addAll(response.data);

                    let results = minisearch.search(msg.query);
                    let structuredReturn = [];
                    for(let i = 0; i<results.length;i++){
                        structuredReturn.push(
                            {
                                id: results[i].id,
                                applicant: results[i].applicant,
                                work: results[i].work,
                                dc_date: results[i].dc_date,
                                state: results[i].state,
                                compl_date: results[i].compl_date
                            }
                        );
                    }

                    done(null,
                        {
                            success : true,
                            data : structuredReturn
                        }
                    )
                }else{
                    done(
                        response
                    )
                }
            });

    });
}

seneca.use(index)

seneca.listen(4002);
seneca.client({port:4000, pin: 'wr:*'});
