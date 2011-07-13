test("QueQue instancing", function() {
    var queue_basic = QueQue();
    ok(
        queue_basic instanceof QueQue
    );
});

test("Basic queue", function() {
    var queue_basic = new QueQue();

    var str = '';

    queue_basic.add(function() {
        str += 'Hello'
    }, { async: false });

    queue_basic.add(function() {
        equal(
            str,
            'Hello'
        );
        str += ' world!'
    }, { async: false });

    queue_basic.onComplete(function() {
        equal(
            str,
            'Hello world!'
        );
    });

    queue_basic.start();
});

test("Using memo", function() {
    var queue_basic = new QueQue();

    var str = '';

    queue_basic.add(function(memo, proxy) {
        memo.push('first!');
    }, { async: false });

    queue_basic.add(function(memo, proxy) {
        memo.push('second!');
    }, { async: false });

    queue_basic.onComplete(function(memo) {
        equal(
            memo.length,
            2
        );
        deepEqual(
            memo,
            ['first!', 'second!']
        );
    });

    queue_basic.start([]);
});

test("Using memo with numbers", function() {
    var queue_basic = new QueQue();

    var str = '';

    queue_basic.add(function(memo, proxy) {
        memo.num++;
    }, { async: false });

    queue_basic.add(function(memo, proxy) {
        memo.num++;
    }, { async: false });

    queue_basic.add(function(memo, proxy) {
        memo.num++;
    }, { async: false });

    queue_basic.onComplete(function(memo) {
        equal(
            memo.num,
            3
        );
    });

    queue_basic.start({
        num: 0
    });
});
