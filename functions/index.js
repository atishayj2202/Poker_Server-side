const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

exports.newUser = functions.auth.user().onCreate((user) => {
  const db = admin.database();
  db.ref("Users/" + user.uid).set({
    Name: user.displayName,
    Status: "idle",
    Chips: 1000,
    Id: user.email,
    Friends: {
      i: 0,
    },
    Data: {
      Won: 0,
      Played: 0,
    },
  });
});

exports.makeUser = functions.https.onCall((req, res) => {
  const email = req["email"];
  const pass = req["password"];
  const name = req["name"].toLowerCase();
  const devId = req["dev_id"];
  const db = admin.database();
  return admin.auth().createUser({
    email: email,
    displayName: name,
    password: pass,
  }).then((userRecord) => {
    return db.ref("Id/"+ devId).update({
      id: email,
      pass: pass,
    }).then(() => {
      return ("Successfull");
    }).catch((error)=>{
      return (error.message);
    });
  }).catch((error) => {
    return (error.message);
  });
});

exports.checkUser = functions.https.onCall((req, res) =>{
  const toCheck = req["username"].toLowerCase();
  const db = admin.database().ref("Users");
  if (toCheck.length > 5) {
    // eslint-disable-next-line max-len
    return db.orderByChild("Name").equalTo(toCheck).once("value").then((snapshot) => {
      let resp;
      if (snapshot.val() === null || snapshot.val() === "") {
        resp = true;
        console.log("answer" + resp);
        return (resp);
      } else {
        resp = false;
        console.log("answer" + resp);
        return (resp);
      }
    }).catch((error) => {
      const resp = false;
      console.log(resp + "error");
      return (resp);
    });
  } else {
    return (false);
  }
});

exports.returnUser = functions.https.onCall((req, res) => {
  const devId = req["id"];
  const db = admin.database();
  return db.ref("Id/" + devId).once("value").then((snapshot) => {
    // eslint-disable-next-line max-len
    return admin.auth().getUserByEmail(snapshot.val()["id"]).then((userRecord) => {
      return db.ref("Users/" + userRecord.uid).once("value").then((snap)=>{
        return {
          status: "Successfull",
          name: userRecord.displayName,
          chips: snap.val()["Chips"],
          won: snap.val()["Data"]["Won"],
          played: snap.val()["Data"]["Played"],
        };
      }).catch((err)=>{
        return {status: err.message};
      });
    }).catch((err)=>{
      return {status: err.message};
    });
  }).catch((err) => {
    return {status: err.message};
  });
});

exports.findUsers = functions.https.onCall((req, res) => {
  const fname = req["name"];
  const db = admin.database().ref("Users");
  // eslint-disable-next-line max-len
  return db.orderByChild("Name").startAt(fname).endAt(fname+"\uf8ff").once("value").then((snapshot) => {
    let i = 0;
    const datas = [];
    const chids = [];
    const udata = [];
    const index = Object.keys(snapshot.val());
    while (i < index.length) {
      datas.push(snapshot.val()[index[i]]["Name"]);
      chids.push(snapshot.val()[index[i]]["Chips"]);
      udata.push(index[i]);
      i = i + 1;
    }
    return {
      Status: "Successfull",
      Ndata: datas,
      Cdata: chids,
      Udata: udata,
    };
  }).catch((err)=>{
    return {Status: err.message};
  });
});

exports.returnReqs = functions.https.onCall((req, res) => {
  const id = req["ID"];
  const db = admin.database();
  const cerr = (err) => {
    return {Status: err.message};
  };
  return db.ref("Id/"+id).once("value").then((temp) => {
    return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) =>{
      const mid = userRecord.uid;
      return db.ref("Users").once("value").then((snapshot) => {
        if (snapshot.val()[mid]["Request"]) {
          const Mdata = snapshot.val()[mid]["Request"];
          const titles = [];
          const captions = [];
          const keyid = [];
          let index = [];
          let i = 0;
          let tempid = "";
          let tempdb = {};
          if (Mdata["Friend"]) {
            tempdb = Mdata["Friend"];
            index = Object.keys(tempdb);
            i = 0;
            while (i < index.length) {
              titles.push("Friend Request");
              tempid = tempdb[index[i]];
              // eslint-disable-next-line max-len
              captions.push("Friend Request from " + (snapshot.val()[tempid]["Name"]).toString());
              keyid.push(index[i]);
              i = i + 1;
            }
          }
          if (Mdata["Game"]) {
            tempdb = Mdata["Game"];
            index = Object.keys(tempdb);
            i = 0;
            while (i < index.length) {
              titles.push("Room Join Request");
              tempid = tempdb[index[i]]["uid"];
              // eslint-disable-next-line max-len
              captions.push((snapshot.val()[tempid]["Name"]).toString() + " asked to join his Room");
              keyid.push(index[i]);
              i = i + 1;
            }
          }
          return {
            Status: "Successfull",
            title: titles,
            caption: captions,
            keyids: keyid,
          };
        } else {
          return ({
            Status: "You Don't Have any Request",
          });
        }
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
});

exports.returnFriends = functions.https.onCall((req, res) => {
  const id = req["id"];
  const db = admin.database();
  const cerr = (err)=>{
    return {Status: err.message};
  };
  return db.ref("Id/" + id).once("value").then((snapshot) => {
    // eslint-disable-next-line max-len
    return admin.auth().getUserByEmail(snapshot.val()["id"]).then((userRecord) => {
      return db.ref("Users").once("value").then((valueF) =>{
        const data = valueF.val()[userRecord.uid]["Friends"];
        const i = data["i"];
        if (i === 0) {
          return {Status: "Unseccusugtyv"};
        } else {
          let cnt = 0;
          const DataN = [];
          const DataC = [];
          while (i > cnt) {
            DataN.push(valueF.val()[data[cnt]]["Name"]);
            DataC.push(valueF.val()[data[cnt]]["Chips"]);
            cnt = cnt + 1;
          }
          return {
            Status: "Successfull",
            Ndata: DataN,
            Cdata: DataC,
          };
        }
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
});

exports.friendRequest = functions.https.onCall((req, res)=>{
  const mdid = req["mid"];
  const fuid = req["fid"];
  const db = admin.database();
  const cerr = (err)=>{
    return (err.message);
  };
  return db.ref("Id/" + mdid).once("value").then((temp) => {
    return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
      const muid = userRecord.uid;
      if (muid === fuid) {
        return ("You Cannot make yourself Friend");
      } else {
        // eslint-disable-next-line max-len
        return db.ref("Users/" + muid + "/Friends").once("value").then((temp2) => {
          const index = temp2.val()["i"];
          let cnt = 0;
          let check = true;
          while (cnt < index) {
            if (temp2.val()[cnt] === fuid) {
              check = false;
              break;
            }
            cnt = cnt + 1;
          }
          if (check) {
            // eslint-disable-next-line max-len
            return db.ref("Users/"+fuid+"/Request/Friend").push().set(muid).then(()=>{
              return db.ref("Notification/Friends").push().set({
                sid: muid,
                rid: fuid,
              }).then(() => {
                return ("Sent Friend Request");
              }).catch(cerr);
            }).catch(cerr);
          } else {
            return ("You are Already Friends");
          }
        }).catch(cerr);
      }
    }).catch(cerr);
  }).catch(cerr);
});

exports.makeRoom = functions.https.onCall((req, res) => {
  const did = req["admin"];
  const mems = req["members"];
  const randP = req["Random_P"];
  const db = admin.database();
  const cerr = (err)=>{
    return {
      Status: err.message,
    };
  };
  return db.ref("Game/Index").once("value").then((IdGet) => {
    const ID = IdGet.val();
    return db.ref("Game/Index").set((ID + 1)).then(() => {
      return db.ref("Id/"+did).once("value").then((temp) => {
        // eslint-disable-next-line max-len
        return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
          const Mid = userRecord.uid;
          return db.ref("Users/"+Mid).once("value").then((Snaper)=>{
            return db.ref("Game/"+ID).set({
              MaxP: mems,
              Status: "Wait Users",
              User1: {
                id: Mid,
                name: Snaper.val()["Name"],
              },
            }).then(() => {
              return db.ref("Users/"+Mid+"/Status").set(ID).then(() => {
                if (randP === true) {
                  return db.ref("Game/RandomG").push().set(ID).then(()=>{
                    return ({
                      Status: "Successfull",
                      Room: ID,
                    });
                  }).catch(cerr);
                } else {
                  return ({
                    Status: "Successfull",
                    Room: ID,
                  });
                }
              }).catch(cerr);
            }).catch(cerr);
          }).catch(cerr);
        }).catch(cerr);
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
});

exports.gameInvite = functions.https.onCall((req, res) => {
  const devId = req["id"];
  const fdn = req["fid"];
  const db = admin.database();
  const cerr = (err)=>{
    return {
      Status: err.message,
    };
  };
  return db.ref("Id/"+devId).once("value").then((temp) => {
    return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
      const mid = userRecord.uid;
      // eslint-disable-next-line max-len
      return db.ref("Users").orderByChild("Name").equalTo(fdn).once("value").then((snap) => {
        const index = Object.keys(snap.val());
        if (index.length === 1) {
          const fid =index[0];
          // eslint-disable-next-line max-len
          return db.ref("Users/" + mid + "/Status").once("value").then((snapshot) => {
            if (snapshot.val() !== "idle") {
              const gameid = snapshot.val();
              return db.ref("Users/" + fid + "/Request/Game").push().set({
                uid: mid,
                gid: gameid,
              }).then(() =>{
                return db.ref("Notification/Game").push().set({
                  sid: mid,
                  rid: fid,
                }).then(() => {
                  return {
                    Status: "Successfull",
                  };
                }).catch(cerr);
              }).catch(cerr);
            } else {
              return ({
                Status: "Unexpected Error",
              });
            }
          }).catch(cerr);
        } else {
          return ({
            Status: "Unexpected Error",
          });
        }
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
});

// eslint-disable-next-line require-jsdoc,camelcase
function room_Join(uid, gid) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({
      Status: err.message,
    });
  };
  return db.ref("Game/"+gid).once("value").then((valueG) => {
    const Data = valueG.val();
    if (Data["Status"] === "Wait Users") {
      const index = Data["MaxP"];
      let cnt = 0;
      let path = "User";
      let Already = true;
      let check = true;
      while (cnt < index) {
        path = "User" + (cnt+1).toString();
        if (Data[path]) {
          if (Data[path]["id"] === uid) {
            Already = false;
            break;
          }
          cnt = cnt + 1;
        } else {
          check = false;
          break;
        }
      }
      if (check) {
        if (Already) {
          return {
            Status: "Sorry, This Room Is Full.",
          };
        } else {
          return {
            Status: "You Already Exsist In This Room",
          };
        }
      } else {
        return db.ref("Users/"+uid).once("value").then((snapX)=>{
          return db.ref("Game/" + gid + "/" + path).update({
            name: snapX.val()["Name"],
            id: uid,
          }).then(() => {
            return db.ref("Users/" + uid).update({
              Status: gid,
            }).then(() => {
              game_Conversion(gid);
              return {
                Status: "Successfull",
                Action: "Game",
              };
            }).catch(cerr);
          }).catch(cerr);
        }).catch(cerr);
      }
    } else {
      if (Data["Status"] === "Playing") {
        return {
          Status: "Sorry, This Room Is Being Played.",
        };
      } else {
        return {
          Status: "Sorry, This Room Is Ended.",
        };
      }
    }
  }).catch(cerr);
}

exports.roomJoin = functions.https.onCall((req, res) => {
  const devId = req["id"];
  const rid = req["rid"];
  const db = admin.database();
  const cerr = (err)=>{
    return ({
      Status: err.message,
    });
  };
  return db.ref("Id/"+devId).once("value").then((temp) => {
    return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
      return room_Join(userRecord.uid, rid);
    }).catch(cerr);
  }).catch(cerr);
});

exports.acceptReq = functions.https.onCall((req, res) => {
  const devId = req["id"];
  const pid = req["pid"];
  const db = admin.database();
  const cerr = (err)=>{
    res.status(200).send(err.message);
    return ({
      Status: err.message,
    });
  };
  return db.ref("Id/"+devId).once("value").then((temp) => {
    return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
      const mid = userRecord.uid;
      return db.ref("Users").once("value").then((snap) => {
        let fcheck = false;
        let gcheck = false;
        let fcindex = [];
        let gindex = [];
        if (snap.val()[mid]["Request"]["Friend"]) {
          fcindex = Object.keys(snap.val()[mid]["Request"]["Friend"]);
          fcheck = true;
        }
        if (snap.val()[mid]["Request"]["Game"]) {
          gindex = Object.keys(snap.val()[mid]["Request"]["Game"]);
          gcheck = true;
        }
        if (fcheck === true || gcheck === true) {
          // eslint-disable-next-line max-len
          if (fcindex.includes(pid) === true && gindex.includes(pid) === false) {
            const fid = snap.val()[mid]["Request"]["Friend"][pid];
            const findex = snap.val()[fid]["Friends"]["i"];
            const mindex = snap.val()[mid]["Friends"]["i"];
            let check = true;
            let cnt = 0;
            while (cnt < mindex) {
              if (fid === snap.val()[mid]["Friends"][cnt]) {
                check = false;
                break;
              }
              cnt = cnt + 1;
            }
            if (check) {
              let x = mindex + 1;
              return db.ref("Users/" + mid + "/Friends/i").set(x).then(() => {
                x = mindex.toString();
                // eslint-disable-next-line max-len
                return db.ref("Users/" + mid + "/Friends/"+x).set(fid).then(() => {
                  x = findex + 1;
                  // eslint-disable-next-line max-len
                  return db.ref("Users/" + fid + "/Friends/i").set(x).then(() => {
                    x = findex.toString();
                    // eslint-disable-next-line max-len
                    return db.ref("Users/" + fid + "/Friends/"+x).set(mid).then(() => {
                      // eslint-disable-next-line max-len
                      return db.ref("Users/"+mid+"/Request/Friend/"+pid).set(null).then(() => {
                        return {
                          Status: "Successfull",
                          Action: "Friends",
                        };
                      }).catch(cerr);
                    }).catch(cerr);
                  }).catch(cerr);
                }).catch(cerr);
              }).catch(cerr);
            } else {
              // eslint-disable-next-line max-len
              return db.ref("Users/"+mid+"/Request/Friend/"+pid).set(null).then(() => {
                return {
                  Status: "You are Already Friends",
                };
              }).catch(cerr);
            }
            // eslint-disable-next-line max-len
          } else if (fcindex.includes(pid) === false && gindex.includes(pid) === true) {
            // eslint-disable-next-line max-len
            return db.ref("Users/"+mid+"/Request/Game/"+pid).once("value").then((value) => {
              const fidg = value.val()["uid"];
              const tempx = value.val()["gid"];
              // eslint-disable-next-line max-len
              return db.ref("Users/"+mid+"/Request/Game/"+pid).set(null).then(() => {
                if (snap.val()[fidg]["Status"] === tempx) {
                  return room_Join(mid, value.val()["gid"]);
                } else {
                  return {
                    Status: "Sorry, Your Friend left Room",
                  };
                }
              }).catch(cerr);
            }).catch(cerr);
          } else {
            return {
              Status: "Sorry, Cannot find Request",
            };
          }
        } else {
          return "Unexpected Error";
        }
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
});

exports.denyReq = functions.https.onCall((req, res) => {
  const devId = req["id"];
  const pid = req["pid"];
  const db = admin.database();
  const cerr = (err)=>{
    return ({
      Status: err.message,
    });
  };
  return db.ref("Id/"+devId).once("value").then((temp) => {
    return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
      const mid = userRecord.uid;
      return db.ref("Users/"+mid).once("value").then((snap) => {
        if (snap.val()["Request"]) {
          const data = snap.val()["Request"];
          if (data["Friend"][pid]) {
            // eslint-disable-next-line max-len
            return db.ref("Users/"+mid+"/Request/Friend/"+pid).set(null).then(() => {
              return {
                Status: "Successfull",
              };
            }).catch(cerr);
          } else if (data["Game"][pid]) {
            // eslint-disable-next-line max-len
            return db.ref("Users/"+mid+"/Request/Game/"+pid).set(null).then(() => {
              return {
                Status: "Successfull",
              };
            }).catch(cerr);
          } else {
            return {
              Status: "dsvhbjns",
            };
          }
        } else {
          return {
            Status: "dsvhbjns",
          };
        }
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
});

// eslint-disable-next-line require-jsdoc
function shuffle(a) {
  let j; let x; let i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

// eslint-disable-next-line require-jsdoc
function setExpiry(gid) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  const now = Date.now() + 30000;
  db.ref("Game/" + gid).update({
    Expiry: now,
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc,camelcase
function change_Player(gid, uN, Round) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  db.ref("Game/" + gid).update({
    Chance: uN,
    Round: Round,
  }).then(() => {
    setExpiry(gid);
    return;
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc,camelcase
function card_Distribute(people, gameid) {
  const db = admin.database();
  const cerr = (err)=>{
    db.ref("err").set(err.message);
    return ({Status: err.message});
  };
  let cards = [];
  let i = 1;
  while (i < 53) {
    cards.push(i);
    i = i+1;
  }
  cards = shuffle(cards);
  cards = shuffle(cards);
  i =0;
  const max = people;
  db.ref("Game/"+gameid).update({
    Status: "Playing",
  }).then(() => {
    return "data";
  }).catch(cerr);
  let cnt = 0;
  let path="";
  let C1 = [];
  let C2 = [];
  while (cnt<max) {
    C1.push(cards[0]);
    C2.push(cards[max]);
    cnt = cnt + 1;
    cards.splice(max, 1);
    cards.splice(0, 1);
  }
  cnt = 0;
  while (cnt<max) {
    path = "User" + (cnt+1).toString();
    db.ref("Game/"+gameid+"/"+path+"/Data").update({
      C1: C1[cnt],
      C2: C2[cnt],
    }).then(() => {
      return ("done");
    }).catch(cerr);
    cnt = cnt + 1;
  }
  C1 = cards[2];
  C2 = cards[4];
  const C3 = cards[6];
  const C4 = cards[8];
  const C5 = cards[10];
  const pot = max*20;
  db.ref("Game/"+gameid).update({
    Pot: pot,
    C1: C1,
    C2: C2,
    C3: C3,
    C4: C4,
    C5: C5,
  }).then(() => {
    takeBoot(gameid);
    return ("done");
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc,camelcase
function game_Conversion(gid) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  db.ref("Game/"+gid).once("value").then((snap) => {
    const Data = snap.val();
    if (gid !== "Index") {
      const max = Data["MaxP"];
      let check = true;
      let cnt = 0;
      let path="";
      while (cnt<max) {
        path = "User" + (cnt+1).toString();
        if (Data[path]) {
          cnt = cnt + 1;
        } else {
          check = false;
          break;
        }
      }
      if (check) {
        if (Data["Status"] === "Wait Users") {
          takeBootE(gid);
          card_Distribute(max, gid);
          change_Player(gid, "User1", 1);
        }
      }
    }
    return;
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc
function makeFold(No, gid) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  db.ref("Game/" + gid + "/" + No).update({
    1: "Fold",
    2: "Fold",
    3: "Fold",
  }).then((value) => {
    // eslint-disable-next-line new-cap
    return Evaluate(gid, No);
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc
function setWinner(gid, uData) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  return db.ref("Game/"+gid).once("value").then((snap) => {
    return db.ref("Users").once("value").then((valueG) => {
      const Data = [];
      const uids = [];
      let temp = 0;
      const mData = {};
      let cnt = 0;
      while (cnt < uData.length) {
        uids.push(snap.val()[uData[cnt]]["id"]);
        cnt = cnt + 1;
      }
      cnt = 0;
      let pot = snap.val()["Pot"];
      pot = pot /uData.length;
      while (cnt < uids.length) {
        Data.push(valueG.val()[uids[cnt]]["Name"]);
        temp = valueG.val()[uids[cnt]]["Chips"] + pot;
        const abc = valueG.val()[uids[cnt]]["Data"]["Won"] + 1;
        // eslint-disable-next-line max-len
        mData[uids[cnt]] = Object.assign(valueG.val()[uids[cnt]], {Chips: temp});
        mData[uids[cnt]]["Data"]["Won"] = abc;
        cnt = cnt + 1;
      }
      return db.ref("Users").update(mData).then(() =>{
        return db.ref("Game/"+gid).update({
          Pot: 0,
          Winner: Data,
          Round: "Voting",
          Chance: 0,
        }).then(() => {
          return "Done";
        }).catch(cerr);
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc
function Evaluate(gid, uN) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  db.ref("Game/"+gid).once("value").then((snap) => {
    let Cround = snap.val()["Round"];
    const max = snap.val()["MaxP"];
    change_Player(gid, "Evaluating", Cround);
    let path = "";
    uN = uN.replace("User", "");
    uN = Number(uN);
    let cnt = 1;
    const DataU = [];
    const DataC = [];
    const DataN = [];
    let fold = 0;
    let next = false;
    while (max > (cnt-1)) {
      path = "User" + cnt.toString();
      cnt = cnt + 1;
      // eslint-disable-next-line no-prototype-builtins
      if (snap.val()[path].hasOwnProperty(Cround)) {
        if (snap.val()[path][Cround] === "Fold") {
          fold = fold + 1;
        } else if (snap.val()[path][Cround]["All"] !== true) {
          DataU.push(path);
          DataC.push(snap.val()[path][Cround]);
        } else {
          DataU.push(path);
          DataC.push(snap.val()[path][Cround]["Amount"]);
          DataN.push(path);
        }
      } else {
        DataU.push(path);
        DataC.push(snap.val()[path][Cround]);
        next = true;
        break;
      }
    }
    if (fold === (max-1)) {
      setWinner(gid, [DataU[0]]);
    } else if ((fold + DataN.length) === max) {
      findW(gid);
    } else if (next) {
      change_Player(gid, path, Cround);
    } else {
      cnt = 0;
      fold = 0;
      next = 0;
      const largest = Math.max(...DataC);
      let largestU = -1;
      let isAll = false;
      while (DataC.length > cnt) {
        if (DataC[cnt] === largest) {
          DataC.splice(cnt, 1);
          DataU.splice(cnt, 1);
        } else {
          cnt = cnt + 1;
        }
      }
      if (DataC.length !== 0) {
        fold = uN;
        uN = uN + 1;
        path = "";
        largestU = true;
        while (largestU) {
          if (uN > max) {
            uN = uN - max;
          }
          if (uN === fold) {
            break;
          }
          isAll = false;
          path = "User" + uN.toString();
          next = 0;
          while (next < DataU.length) {
            if (DataU[next] === path) {
              isAll = true;
              break;
            }
            next = next + 1;
          }
          if (isAll) {
            break;
          }
          uN = uN + 1;
        }
        change_Player(gid, path, Cround);
      } else {
        if (Cround === 3) {
          findW(gid);
        } else {
          cnt = 1;
          Cround = Cround + 1;
          path = "";
          while (cnt-1 < max) {
            path = "User" + cnt.toString();
            if (snap.val()[path][Cround]) {
              cnt = cnt + 1;
            } else {
              break;
            }
          }
          change_Player(gid, path, Cround);
        }
      }
    }
    return;
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc
function setRank(Rank) {
  let color = 0;
  let rc = 0;
  let cnt = 0;
  const temp = [];
  while (cnt < Rank.length) {
    if (Rank[cnt] > 38) {
      color = "Diamond";
      rc = (Rank[cnt]%13)+1;
    } else if (Rank[cnt] > 25) {
      color = "Club";
      rc = (Rank[cnt]%13)+1;
    } else if (Rank[cnt] > 12) {
      color = "Spade";
      rc = (Rank[cnt]%13)+1;
    } else {
      color = "Heart";
      rc = (Rank[cnt]%13)+1;
    }
    cnt = cnt + 1;
    temp.push({
      Color: color,
      Rank: rc,
    });
  }
  return temp;
}

// eslint-disable-next-line require-jsdoc
function flushCheck(Cards) {
  const spade=[];
  const heart=[];
  const club=[];
  const diamond=[];
  let i =0;
  let path = "";
  while (i<Cards.length) {
    path = "C" + (i+1).toString();
    if (Cards[i] === "Diamond") {
      diamond.push(path);
    } else if (Cards[i] === "Heart") {
      heart.push(path);
    } else if (Cards[i] === "Spade") {
      spade.push(path);
    } else if (Cards[i] === "Club") {
      club.push(path);
    }
    i = i + 1;
  }
  path = false;
  if (spade.length > 4) {
    path = true;
  } else if (diamond.length > 4) {
    path = true;
  } else if (heart.length > 4) {
    path = true;
  } else if (club.length > 4) {
    path = true;
  } else {
    path = false;
  }
  return {
    Club: club,
    Spade: spade,
    Heart: heart,
    diamond: diamond,
    Check: path,
  };
}

// eslint-disable-next-line require-jsdoc
function highCheck(Cards) {
  if (Cards[0]=== 1 || 1 === Cards[1]) {
    return 14;
  } else if (Cards[0]>Cards[1]) {
    return (Cards[0]);
  } else {
    return (Cards[1]);
  }
}

// eslint-disable-next-line require-jsdoc
function pairCheck(Cards) {
  let Ace=0;
  let King=0;
  let Queen=0;
  let Jack=0;
  let no2=0;
  let no3=0;
  let no4=0;
  let no5=0;
  let no6=0;
  let no7=0;
  let no8=0;
  let no9=0;
  let no10=0;
  let i =0;
  let path = "";
  while (i<Cards.length) {
    if (Cards[i] === 1) {
      Ace = Ace + 1;
    } else if (Cards[i] === 13) {
      King = King + 1;
    } else if (Cards[i] === 12) {
      Queen = Queen + 1;
    } else if (Cards[i] === 11) {
      Jack = Jack + 1;
    } else if (Cards[i] === 10) {
      no10 = no10 + 1;
    } else if (Cards[i] === 9) {
      no9 = no9 + 1;
    } else if (Cards[i] === 8) {
      no8 = no8 + 1;
    } else if (Cards[i] === 7) {
      no7 = no7 + 1;
    } else if (Cards[i] === 6) {
      no6 = no6 + 1;
    } else if (Cards[i] === 5) {
      no5 = no5 + 1;
    } else if (Cards[i] === 4) {
      no4 = no4 + 1;
    } else if (Cards[i] === 3) {
      no3 = no3 + 1;
    } else if (Cards[i] === 2) {
      no2 = no2 + 1;
    }
    i = i + 1;
  }
  path = [];
  i = 0;
  // eslint-disable-next-line max-len
  const data = [Ace, King, Queen, Jack, no10, no2, no3, no4, no5, no6, no7, no8, no9];
  while (i < data.length) {
    if (data[i] > 0) {
      path.push(data[i]);
    }
    i = i + 1;
  }
  King = 0;
  Queen = 0;
  Jack = 0;
  Ace = 0;
  i = 0;
  while (i < path.length) {
    if (path[i] > 3) {
      King = King +1;
    } else if (path[i] > 2) {
      Queen = Queen +1;
    } else if (path[i] > 1) {
      Jack = Jack +1;
    } else {
      Ace = Ace +1;
    }
    i = i + 1;
  }
  return {
    Pair4: King,
    Pair3: Queen,
    Pair2: Jack,
    Single: Ace,
    abc: path,
  };
}

// eslint-disable-next-line require-jsdoc
function straightCheck(Cards) {
  let path = [];
  let temp = [];
  let i = 1;
  let x = 0;
  let cnt = 0;
  const Data = Cards;
  while (i<14) {
    if (i === 10) {
      i = i + 1;
    }
    x = i;
    temp.push(x);
    while (cnt < 4) {
      x = x + 1;
      if (x > 13) {
        x = x - 13;
      }
      temp.push(x);
      cnt = cnt + 1;
    }
    path.push(temp);
    temp = [];
    cnt = 0;
    i = i + 1;
  }
  path.push([10, 11, 12, 13, 1]);
  path = path.reverse();
  cnt = 0;
  i = 0;
  x = 0;
  let check = 0;
  let s = 15;
  while (cnt < path.length) {
    temp = path[cnt];
    while (i<temp.length) {
      while (x < Data.length) {
        if (temp[i] === Data[x]) {
          temp[i] = 0;
          check = check + 1;
          if (Data[x] < s && Data[x] !== 1) {
            s = Data[x];
          }
        }
        x = x +1;
      }
      i = i + 1;
      x = 0;
    }
    if (check > 4) {
      break;
    }
    s = 15;
    check = 0;
    x = 0;
    i = 0;
    cnt = cnt + 1;
  }
  i = false;
  if (check >4) {
    cnt = true;
    if (s === 10) {
      i =true;
    } else {
      i = false;
    }
  } else {
    cnt = false;
    i = false;
  }
  return ({
    Straight: cnt,
    Royal: i,
  });
}

// eslint-disable-next-line require-jsdoc
function gameRank(uN, no, gid) {
  let C = [];
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  return db.ref("Game/"+gid).once("value").then((snap) => {
    C.push((snap.val()[uN]["Data"]["C1"]) - 1);
    C.push((snap.val()[uN]["Data"]["C2"]) - 1);
    C.push((snap.val()["C1"]) - 1);
    C.push((snap.val()["C2"]) - 1);
    C.push((snap.val()["C3"]) - 1);
    C.push((snap.val()["C4"]) - 1);
    C.push((snap.val()["C5"]) - 1);
    C = setRank(C);
    let i = 0;
    const suits = [];
    const ranks = [];
    if (no === 5) {
      C[6]["Color"]=undefined;
      C[6]["Rank"]=undefined;
      C[5]["Color"]=undefined;
      C[5]["Rank"]=undefined;
    } else if (no === 6) {
      C[6]["Color"]=undefined;
      C[6]["Rank"]=undefined;
    }
    while (i<C.length) {
      suits.push(C[i]["Color"]);
      ranks.push(C[i]["Rank"]);
      i = i +1;
    }
    const fl = flushCheck(suits);
    const st = straightCheck(ranks);
    const pa = pairCheck(ranks);
    i = 1;
    C = null;
    if (fl["Check"] === true && st["Royal"] === true) {
      i = 10;
    } else if (fl["Check"] === true && st["Straight"] === true) {
      i = 9;
    } else if (pa["Pair4"] > 0) {
      i = 8;
    } else if (pa["Pair3"] > 0 && pa["Pair2"] > 0) {
      i = 7;
    } else if (fl["Check"] === true) {
      i = 6;
    } else if (st["Straight"] === true) {
      i = 5;
    } else if (pa["Pair3"] > 0) {
      i = 4;
      C = 0;
      C = highCheck(ranks);
    } else if (pa["Pair2"] > 1) {
      i = 3;
      C = 0;
      C = highCheck(ranks);
    } else if (pa["Pair2"] > 0) {
      i = 2;
      C = 0;
      C = highCheck(ranks);
    } else {
      i = 1;
      C = 0;
      C = highCheck(ranks);
    }
    db.ref("Game/"+gid+"/"+uN+"/Data/E").update({
      Result: i,
      High: C,
    });
    return "Done";
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc
function takeBoot(gid) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  let path = "";
  db.ref("Game/"+gid).once("value").then((valueG) => {
    const mems = valueG.val()["MaxP"];
    let Chipsx = 0;
    let uid = "";
    return db.ref("Users").once("value").then((snap) =>{
      let i = 1;
      const Data = snap.val();
      const temp = {};
      while (mems > (i-1)) {
        path = "User"+i.toString();
        uid = valueG.val()[path]["id"];
        Chipsx = Data[uid]["Chips"];
        Chipsx = Chipsx - 20;
        const syz = Data[uid]["Data"]["Played"] + 1;
        temp[uid] = Object.assign(Data[uid], {Chips: Chipsx});
        temp[uid]["Data"]["Played"] = syz;
        i = i + 1;
      }
      db.ref("Users").update(temp).catch(cerr);
      return;
    }).catch(cerr);
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc
function takeBootE(gid) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  let path = "";
  db.ref("Game/"+gid).once("value").then((valueG) => {
    const mems = valueG.val()["MaxP"];
    let Chipsx = 0;
    let uid = "";
    return db.ref("Users").once("value").then((snap) =>{
      let i = 1;
      const Data = snap.val();
      const temp = {};
      while (mems > (i-1)) {
        path = "User"+i.toString();
        uid = valueG.val()[path]["id"];
        Chipsx = Data[uid]["Chips"];
        Chipsx = Chipsx - 20;
        temp[uid] = Object.assign(Data[uid], {Chips: Chipsx});
        i = i + 1;
      }
      db.ref("Users").update(temp).catch(cerr);
      return;
    }).catch(cerr);
  }).catch(cerr);
}

exports.checkExpiry = functions.https.onCall((req, res) => {
  const db = admin.database();
  const gid = req["gid"];
  const uid = req["uid"];
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  const i = Date.now();
  return db.ref("Game/" + gid).once("value").then((snap)=>{
    if (uid !== snap.val()["Chance"]) {
      return;
    }
    if (i >= snap.val()["Expiry"]) {
      makeFold(uid, gid);
      return;
    } else {
      return;
    }
  }).catch(cerr);
});

exports.raiseBid = functions.https.onCall((req, res) => {
  const gid = req["gid"];
  const uN = req["id"];
  const Amount = req["amount"];
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  return db.ref("Game/"+ gid).once("value").then((snap) => {
    let cnt = 1;
    const max = snap.val()["MaxP"];
    const Cround = snap.val()["Round"];
    let high = 0;
    let path = "";
    let DataC = 0;
    const temp = [];
    while ((cnt - 1) < max) {
      path = "User" + cnt.toString();
      if (snap.val()[path][Cround]) {
        if (snap.val()[path][Cround] !== "Fold") {
          if (snap.val()[path][Cround]["All"]) {
            DataC = snap.val()[path][Cround]["Amount"];
            temp.push(path);
          } else {
            DataC=snap.val()[path][Cround];
          }
          if (high <DataC) {
            high = DataC;
          }
        }
      }
      cnt = cnt + 1;
    }
    const uid = snap.val()[uN]["id"];
    if (high > Amount) {
      return ({Status: "Your Raised amount is less than highest bid"});
    } else {
      high = Amount;
      return db.ref("Users/"+uid).once("value").then((valueF)=>{
        let Chipsx = valueF.val()["Chips"];
        const pot = high + snap.val()["Pot"];
        if (Chipsx > high) {
          Chipsx = Chipsx -high;
          return db.ref("Users/"+uid).update({Chips: Chipsx}).then(() => {
            return db.ref("Game/"+gid).update({Pot: pot}).then(() => {
              // eslint-disable-next-line max-len
              return db.ref("Game/" + gid + "/" + uN + "/" + Cround).set(high).then(() => {
                const x = {
                  1: {
                    All: true,
                    Amount: high,
                  },
                  2: {
                    All: true,
                    Amount: high,
                  },
                  3: {
                    All: true,
                    Amount: high,
                  },
                };
                let abc = {};
                let cnt = 0;
                const Data = {};
                while (cnt < temp.length) {
                  abc = snap.val()[temp[cnt]];
                  Data[temp[cnt]] = Object.assign(abc, x);
                  cnt = cnt + 1;
                }
                db.ref("Game/"+gid).update(Data);
                // eslint-disable-next-line new-cap
                Evaluate(gid, uN);
                return ({Status: "Successfull"});
              }).catch(cerr);
            }).catch(cerr);
          }).catch(cerr);
        } else {
          return ({Status: "You need to select All-In"});
        }
      }).catch(cerr);
    }
  }).catch(cerr);
});

exports.returnData = functions.https.onCall((req, res) => {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  const devId = req["id"];
  return db.ref("Id/"+devId).once("value").then((temp) => {
    return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
      const id = userRecord.uid;
      return db.ref("Users").once("value").then((snap) =>{
        const temp = snap.val()[id]["Status"];
        if (temp === "idle") {
          return {
            Status: "Successfull",
            name: snap.val()[id]["Name"],
            chips: snap.val()[id]["Chips"],
            won: snap.val()[id]["Data"]["Won"],
            played: snap.val()[id]["Data"]["Played"],
          };
        } else {
          return db.ref("Game/" + temp).once("value").then((valueG) => {
            const Gstatus = valueG.val()["Status"];
            let cnt = 1;
            let mid = "";
            let path = "";
            let Users = {};
            let x = "";
            let Cround = {};
            if (Gstatus === "Playing") {
              Cround = valueG.val()["Round"];
              if (Cround === "Voting") {
                Users = [];
                cnt = 0;
                while (cnt < 9) {
                  // eslint-disable-next-line no-prototype-builtins
                  if (valueG.val()["Winner"].hasOwnProperty(cnt)) {
                    Users.push(valueG.val()["Winner"]);
                  } else {
                    break;
                  }
                  cnt = cnt + 1;
                }
                return ({
                  Status: "Game",
                  GameId: temp,
                  GameStatus: "Voting",
                  Winner: Users,
                });
              }
              const Cards = [];
              Cards.push(valueG.val()["C1"]);
              Cards.push(valueG.val()["C2"]);
              Cards.push(valueG.val()["C3"]);
              Cards.push(valueG.val()["C4"]);
              Cards.push(valueG.val()["C5"]);
              cnt = 1;
              mid = "";
              path = "";
              Users = {};
              x = "";
              while ((cnt-1) < valueG.val()["MaxP"]) {
                path = "User" + cnt.toString();
                cnt = cnt +1;
                if (valueG.val()[path]["id"] === id) {
                  mid = path;
                }
                x = valueG.val()[path]["id"];
                Users[path] = {
                  Name: snap.val()[x]["Name"],
                  Play: valueG.val()[path][Cround],
                };
              }
              if (mid !== valueG.val()["Chance"]) {
                cnt = Number(mid.slice(4)) * 1000;
                cnt = cnt + valueG.val()["Expiry"];
              }
              Cards.push(valueG.val()[mid]["Data"]["C1"]);
              Cards.push(valueG.val()[mid]["Data"]["C2"]);
              return gameRank(mid, (Cround + 4), temp).then(() => {
                // eslint-disable-next-line max-len
                return db.ref("Game/" + temp+"/"+mid+"/Data/E").once("value").then((valueF) => {
                  return ({
                    Status: "Game",
                    Cards: Cards,
                    Udata: Users,
                    Round: Cround,
                    GameStatus: Gstatus,
                    Mid: mid,
                    Chips: snap.val()[id]["Chips"],
                    GameId: temp,
                    Chance: valueG.val()["Chance"],
                    Evaluate: valueF.val(),
                    Pot: valueG.val()["Pot"],
                    Max: valueG.val()["MaxP"],
                  });
                }).catch(cerr);
              }).catch(cerr);
            } else if (Gstatus === "Wait Users") {
              while ((cnt-1) < valueG.val()["MaxP"]) {
                path = "User" + cnt.toString();
                cnt = cnt +1;
                if (valueG.val()[path]) {
                  if (valueG.val()[path]["id"] === id) {
                    mid = path;
                  }
                  x = valueG.val()[path]["id"];
                  Users[path] = {
                    Name: snap.val()[x]["Name"],
                  };
                } else {
                  Users[path] ={
                    Name: null,
                  };
                }
              }
              return ({
                Status: "Game",
                Udata: Users,
                GameStatus: Gstatus,
                Mid: mid,
                GameId: temp,
                Max: valueG.val()["MaxP"],
              });
            } else {
              db.ref("Users/" + id).update({Status: "idle"});
              return {
                Status: "Successfull",
                name: snap.val()[id]["Name"],
                chips: snap.val()[id]["Chips"],
                won: snap.val()[id]["Data"]["Won"],
                played: snap.val()[id]["Data"]["Played"],
              };
            }
          }).catch(cerr);
        }
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
});

exports.voteGame = functions.https.onCall((req, res) => {
  const db = admin.database();
  const cerr = (err)=>{
    res.status(200).send({Status: err.message});
  };
  const gid = 1;
  return db.ref("Game/"+gid).once("value").then((snap) => {
    const max = snap.val()["MaxP"];
    const Chance = snap.val()["Chance"] + 1;
    const Data = snap.val();
    let cnt = 1;
    let path = "";
    if (Chance === max) {
      Data["Winner"] = null;
      while ((cnt-1) < max) {
        path = "User" + cnt.toString();
        cnt = cnt + 1;
        Data[path] = {
          id: snap.val()[path]["id"],
        };
      }
      db.ref("Game/"+gid).update(Data).then(()=>{
        card_Distribute(max, gid);
        change_Player(gid, "User1", 1);
        return;
      }).catch(cerr);
    } else {
      db.ref("Game/"+gid).update({"Chance": Chance}).then(()=>{
        return;
      }).catch(cerr);
    }
    return ({Status: "Sucessfull"});
  }).catch(cerr);
});

exports.Test = functions.https.onRequest((req, res) => {
  const db = admin.database();
  const cerr = (err)=>{
    res.status(200).send(err.message);
    return ({Status: err.message});
  };
  db.ref("abc").once("value").then((snapi) => {
    const gid = snapi.val()["1"];
    const id = snapi.val()["2"];
    // eslint-disable-next-line new-cap
    Evaluate(gid, id);
    res.status(200).send("Done");
    return;
  }).catch(cerr);
});

exports.voteRGame = functions.https.onCall((req, res) => {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  const gid = req["gid"];
  return db.ref("Game/"+gid).once("value").then((snap) => {
    db.ref("Game/"+gid).set({
      Status: "END",
      Chance: "END",
      Round: "END",
      Winner: snap.val()["Winner"],
    });
    return ({Status: "Sucessfull"});
  }).catch(cerr);
});


exports.allBid = functions.https.onCall((req, res) => {
  // eslint-disable-next-line new-cap
  return All(req["gid"], req["uid"]);
});

exports.foldBid = functions.https.onCall((req, res) => {
  return makeFold(req["uid"], req["gid"]);
});

exports.callBid = functions.https.onCall((req, res) => {
  checkCall(req["gid"], req["uid"]);
});

// eslint-disable-next-line require-jsdoc
function checkCall(gid, uN) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  return db.ref("Game/"+ gid).once("value").then((snap) => {
    let cnt = 1;
    const max = snap.val()["MaxP"];
    const Cround = snap.val()["Round"];
    let high = 0;
    let path = "";
    let DataC = 0;
    while ((cnt - 1) < max) {
      path = "User" + cnt.toString();
      if (snap.val()[path][Cround]) {
        if (snap.val()[path][Cround] !== "Fold") {
          if (snap.val()[path][Cround]["All"]) {
            DataC = snap.val()[path][Cround]["Amount"];
          } else {
            DataC=snap.val()[path][Cround];
          }
          if (high <DataC) {
            high = DataC;
          }
        }
      }
      cnt = cnt + 1;
    }
    const uid = snap.val()[uN]["id"];
    return db.ref("Users/"+uid).once("value").then((valueF)=>{
      let Chipsx = valueF.val()["Chips"];
      const pot = high + snap.val()["Pot"];
      if (Chipsx > high) {
        Chipsx = Chipsx -high;
        return db.ref("Users/"+uid).update({Chips: Chipsx}).then(() => {
          const Data = snap.val();
          Data["Pot"] = pot;
          Data[uN][Cround] = high;
          return db.ref("Game/"+gid).update(Data).then(() => {
            // eslint-disable-next-line new-cap
            return Evaluate(gid, uN);
          }).catch(cerr);
        }).catch(cerr);
      } else {
        // eslint-disable-next-line new-cap
        All(gid, uN);
        return;
      }
    });
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc
function findW(gid) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  return db.ref("Game/"+gid).once("value").then((snap) => {
    let cnt = 1;
    const max = snap.val()["MaxP"];
    let path = "";
    let high = 0;
    let Users = [];
    let UsersH = [];
    while ((cnt-1) < max) {
      path = "User" + cnt.toString();
      cnt = cnt +1;
      if (snap.val()[path]["1"] !== "Fold") {
        if (high < snap.val()[path]["Data"]["E"]["Result"]) {
          high = snap.val()[path]["Data"]["E"]["Result"];
          Users = [path];
          UsersH = [];
          if (high < 5) {
            UsersH = [snap.val()[path]["Data"]["E"]["High"]];
          }
        } else if (snap.val()[path]["Data"]["E"]["Result"] === high) {
          Users.push(path);
          if (high < 5) {
            UsersH.push(snap.val()[path]["Data"]["E"]["High"]);
          }
        }
      }
    }
    if (Users.length > 1 && high < 5) {
      cnt = 0;
      high = 0;
      let Data = [];
      while (cnt < Users.length) {
        if (high < UsersH[cnt]) {
          high = UsersH[cnt];
          Data = [];
          Data.push(Users[cnt]);
        } else if (high === UsersH[cnt]) {
          Data.push(Users[cnt]);
        }
        cnt = cnt + 1;
      }
      Users = Data;
    }
    setWinner(gid, Users);
    change_Player(gid, 0, "Voting");
    return;
  }).catch(cerr);
}

// eslint-disable-next-line require-jsdoc
function All(gid, uN) {
  const db = admin.database();
  const cerr = (err)=>{
    return ({Status: err.message});
  };
  return db.ref("Game/" + gid).once("value").then((snap) => {
    let DataC = [];
    let cnt = 1;
    const max = snap.val()["MaxP"];
    let path = "";
    const temp = [];
    const Cround = snap.val()["Round"];
    while ((cnt - 1) < max) {
      path = "User" + cnt.toString();
      if (snap.val()[path][Cround]) {
        if (snap.val()[path][Cround] !== "Fold") {
          if (snap.val()[path][Cround]["All"]) {
            DataC.push(snap.val()[path][Cround]["Amount"]);
            temp.push(path);
          } else {
            DataC.push(snap.val()[path][Cround]);
          }
        }
      }
      cnt = cnt + 1;
    }
    temp.push(uN);
    DataC = Math.max(...DataC);
    const uid = snap.val()[uN]["id"];
    return db.ref("Users/"+uid).once("value").then((valueF) =>{
      const Chipsx = valueF.val()["Chips"];
      const pot = Chipsx + snap.val()["Pot"];
      if (DataC < Chipsx) {
        const Data = {};
        cnt = 0;
        let abc = {};
        const x = {
          1: {
            All: true,
            Amount: Chipsx,
          },
          2: {
            All: true,
            Amount: Chipsx,
          },
          3: {
            All: true,
            Amount: Chipsx,
          },
        };
        while (cnt < temp.length) {
          abc = snap.val()[temp[cnt]];
          Data[temp[cnt]] = Object.assign(abc, x);
          cnt = cnt + 1;
        }
        db.ref("Game/"+gid).update(Data);
      } else {
        db.ref("Game/"+gid+"/"+uN).update({
          1: {
            All: true,
            Amount: DataC,
          },
          2: {
            All: true,
            Amount: DataC,
          },
          3: {
            All: true,
            Amount: DataC,
          },
        }).catch(cerr);
      }
      return db.ref("Game/"+gid).update({Pot: pot}).then(() => {
        // eslint-disable-next-line new-cap
        Evaluate(gid, uN);
        db.ref("Users/" + uid).update({Chips: 0}).catch(cerr);
        return;
      }).catch(cerr);
    }).catch(cerr);
  }).catch(cerr);
}
