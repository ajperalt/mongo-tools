(function() {
    if (typeof getToolTest === 'undefined') {
        load('jstests/configs/plain_28.config.js');
    }
    jsTest.log('Testing running import with various data types');

    var toolTest = getToolTest('import');
    var db1 = toolTest.db
    var commonToolArgs = getCommonToolArguments()

    var testDoc = {
      _id : ObjectId(),
      a : BinData(0,"e8MEnzZoFyMmD7WSHdNrFJyEk8M="),
      d : "this is a string",
      e : ["this is an ", 2, 23.5, "array with various types in it"],
      f : {"this is": "an embedded doc"},
      g : function(){print("hey sup")},
      h : null,
      i : true,
      j : false,
      k : NumberLong(10000),
      l : MinKey(),
      m : MaxKey(),
      n : ISODate("2015-02-25T16:42:11Z"),
      o: DBRef('namespace', 'identifier', 'database'),
    }



    //Make a dummy file to import by writing a test collection and exporting it
    assert.eq( 0 , db1.c.count() , "setup1" );
    db1.c.save(testDoc)
    toolTest.runTool.apply(toolTest, ["export" , "--out" , toolTest.extFile , "-d" , toolTest.baseName , "-c" , db1.c.getName()].concat(commonToolArgs));

    var ret = toolTest.runTool.apply(toolTest, ["import", "--file",toolTest.extFile, "--db", "imported", "--collection", "testcoll2"].concat(commonToolArgs))
    var postImportDoc = db1.c.getDB().getSiblingDB("imported").testcoll2.findOne()

    printjson(postImportDoc)

    docKeys = Object.keys(testDoc)
    for(var i=0;i<docKeys.length;i++){
      jsTest.log("checking field", docKeys[i])
      assert.eq(testDoc[docKeys[i]], postImportDoc[docKeys[i]], "imported field " + docKeys[i] + " does not match original")
    }

    // DBPointer should turn into a DBRef with a $ref field and hte $id field being an ObjectId. It will not convert back to a DBPointer. 
    
    var oid = ObjectId()
    var testDBPointer = {
      _id : ObjectId(),
      a : DBPointer('namespace', oid),
    }

    db1.c.drop()
    db1.c.getDB().getSiblingDB("imported").testcoll3.drop()
    assert.eq( 0 , db1.c.count() , "setup1" );
    db1.c.save(testDBPointer);
    toolTest.runTool.apply(toolTest, ["export" , "--out" , toolTest.extFile , "-d" , toolTest.baseName , "-c" , db1.c.getName()].concat(commonToolArgs));

    var ret = toolTest.runTool.apply(toolTest, ["import", "--file",toolTest.extFile, "--db", "imported", "--collection", "testcoll3"].concat(commonToolArgs))
    var postImportDoc = db1.c.getDB().getSiblingDB("imported").testcoll3.findOne()

    printjson(postImportDoc);

    var dbRef = DBRef("namespace", oid );
    assert.eq(postImportDoc["a"], dbRef);


    toolTest.stop();
}());
