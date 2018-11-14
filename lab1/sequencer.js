
sequenced = [];
local_seq = 0;

function getSeq(req){
    if(sequenced.indexOf(req.id) === -1){
        //NO Está
        sequence = TOCast(req);
        while (TOCast(req) === -1){
            //Hay que preguntar al resto de secuenciadores su secuencia ?????
            sequence = TOCast(req);
        }
        return sequence;
    }
    else{
        return sequenced.indexOf(req.id);
    }
}

function getReq(j){
    if(sequenced.indexOf(req.id) !== -1)
        return sequenced[j];
    return null;
}

function TODeliver(req, handler){
    if(sequenced.indexOf(req) === -1){
        //NO Está
        sequenced[local_seq] = req;
        local_seq = local_seq + 1;
    }
}

function TOCast(req){
    return sequenced.indexOf(req);
}