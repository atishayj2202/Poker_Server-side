const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.newUser = functions.auth.user().onCreate((user) => {
	var db = admin.database();
	db.ref("Users/" + user.uid).set({
		Name: user.displayName,
		Status : "idle",
		Chips: 1000,
		Id: user.email,
		Friends: {
			i : 0,
		},
		Data: {
			Won : 0,
			Played : 0,
		}
	})
});

exports.makeUser = functions.https.onCall((req, res) => {
	const email = req["email"];
	const pass = req["password"];
	const name = req["name"].toLowerCase();
	const dev_id = req["dev_id"];
	var db = admin.database();
	return admin.auth().createUser({
		email: email,
		displayName : name,
		password : pass
	}).then((userRecord) => {
		return db.ref("Id/"+ dev_id).update({
			id : email,
			pass :  pass,
		}).then(() => {
			return("Successfull");
		}).catch((error)=>{
			return(error.message);
		})
	}).catch((error) => {
		return(error.message);
	})
})

exports.checkUser = functions.https.onCall((req, res) =>{
	var toCheck = req["username"].toLowerCase();
	var db = admin.database().ref("Users");
	if (toCheck.length > 5){
		return db.orderByChild("Name").equalTo(toCheck).once('value').then((snapshot) => {
			var resp;
			if(snapshot.val() === null || snapshot.val() === ""){
				resp = true;
				console.log("answer" + resp);
				return(resp);
			}
			else{
				resp = false;
				console.log("answer" + resp);
				return(resp);
			}
		}).catch((error) => {
			resp = false;
			console.log(resp + "error");
			return(resp);
		});
	}
	else{
		return(false);
	}
})

exports.returnUser = functions.https.onCall((req, res) => {
	var dev_id = req["id"];
	var db = admin.database();
	return db.ref("Id/" + dev_id).once("value").then((snapshot) => {
		return admin.auth().getUserByEmail(snapshot.val()["id"]).then((userRecord) => {
			return db.ref("Users/" + userRecord.uid).once("value").then((snap)=>{
				return {
					status : "Successfull",
					name : userRecord.displayName,
					chips : snap.val()["Chips"],
					won : snap.val()["Data"]["Won"],
					played : snap.val()["Data"]["Played"],
				}
			}).catch((err)=>{
				return{status:err.message}
			})
		}).catch((err)=>{
			return{status:err.message}
		})
	}).catch((err) => {
		return{status:err.message}
	})
})

exports.findUsers = functions.https.onCall((req, res) => {
	var fname = req["name"];
	var db = admin.database().ref("Users");
	return db.orderByChild("Name").startAt(fname).endAt(fname+"\uf8ff").once("value").then((snapshot) => {
		var i = 0;
		var datas = [];
		var chids = [];
		var udata = [];
		var index = Object.keys(snapshot.val());
		while(i < index.length){
			datas.push(snapshot.val()[index[i]]["Name"]);
			chids.push(snapshot.val()[index[i]]["Chips"]);
			udata.push(index[i]);
			i = i + 1;
		}
		return {
			Status : "Successfull",
			Ndata : datas,
			Cdata : chids,
			Udata : udata,
		};
	}).catch((err)=>{
		return {Status : err.message};
	});
})

exports.returnReqs = functions.https.onCall((req, res) => {
	var id = req["ID"];
	var db = admin.database();
	var cerr = (err) => {
		return {Status : err.message};
	}
	return db.ref("Id/"+id).once("value").then((temp) => {
		return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) =>{
			var mid = userRecord.uid;
			return db.ref("Users").once("value").then((snapshot) => {
				if(snapshot.val()[mid]["Request"]){
					var Mdata = snapshot.val()[mid]["Request"];
					var titles = [];
					var captions = [];
					var keyid = [];
					var index = [];
					var i = 0;
					var tempid = "";
					var tempdb = {};
					if(Mdata["Friend"]){
						tempdb = Mdata["Friend"];
						index = Object.keys(tempdb);
						i = 0;
						while(i < index.length){
							titles.push("Friend Request");
							tempid = tempdb[index[i]];
							captions.push("Friend Request from " + (snapshot.val()[tempid]["Name"]).toString())
							keyid.push(index[i])
							i = i + 1;
						}
					}
					if (Mdata["Game"]){
						tempdb = Mdata["Game"]
						index = Object.keys(tempdb);
						i = 0;
						while(i < index.length){
							titles.push("Room Join Request");
							tempid = tempdb[index[i]]["uid"];
							captions.push((snapshot.val()[tempid]["Name"]).toString() + " asked to join his Room")
							keyid.push(index[i])
							i = i + 1;
						}
					}
					return{
						Status : "Successfull",
						title : titles,
						caption : captions,
						keyids : keyid
					}
				}
				else{
					return({
						Status : "You Don't Have any Request",
					})
				}
			}).catch(cerr)
		}).catch(cerr)
	}).catch(cerr)
})

exports.returnFriends = functions.https.onCall((req, res) => {
	var id = req["id"];
	var db = admin.database();
	var cerr = (err)=>{
		return {Status : err.message};
	}
	return db.ref("Id/" + id).once("value").then((snapshot) => {
		return admin.auth().getUserByEmail(snapshot.val()["id"]).then((userRecord) => {
			return db.ref("Users").once("value").then((valueF) =>{
				var data = valueF.val()[userRecord.uid]["Friends"];
				var i = data["i"];
				if(i === 0){
					return{Status : "Unseccusugtyv"}
				}
				else{
					var cnt = 0;
					var DataN = [];
					var DataC = [];
					while(i > cnt){
						DataN.push(valueF.val()[data[cnt]]["Name"]);
						DataC.push(valueF.val()[data[cnt]]["Chips"]);
						cnt = cnt + 1;
					}
					return {
						Status : "Successfull",
						Ndata : DataN,
						Cdata : DataC,
					};
				}
			}).catch(cerr)
		}).catch(cerr)
	}).catch(cerr)
})

exports.friendRequest = functions.https.onCall((req, res)=>{
	var mdid = req["mid"];
	var fuid = req["fid"];
	var db = admin.database();
	var cerr = (err)=>{
		return (err.message);
	}
	return db.ref("Id/" + mdid).once("value").then((temp) => {
		return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
			var muid = userRecord.uid;
			if (muid === fuid){
				return("You Cannot make yourself Friend");
			}
			else{
				return db.ref("Users/" + muid + "/Friends").once("value").then((temp2) => {
					var index = temp2.val()["i"];
					var cnt = 0;
					var check = true;
					while(cnt < index){
						if (temp2.val()[cnt] === fuid){
							check = false;
							break;
						}
						cnt = cnt + 1;
					}
					if(check){
						return db.ref("Users/"+fuid+"/Request/Friend").push().set(muid).then(()=>{
							return db.ref("Notification/Friends").push().set({
								sid:muid,
								rid:fuid
							}).then(() => {
								return("Sent Friend Request");
							}).catch(cerr)
						}).catch(cerr);
					}
					else{
						return("You are Already Friends");
					}
				}).catch(cerr)
			}
		}).catch(cerr);
	}).catch(cerr)
})

exports.makeRoom = functions.https.onCall((req, res) => {
	var did = req["admin"];
	var mems = req["members"];
	var Rand_p = req["Random_P"];
	var db = admin.database();
	var cerr = (err)=>{
		return {
			Status : err.message,
		};
	}
	return db.ref("Game/Index").once("value").then((IdGet) => {
		var ID = IdGet.val();
		return db.ref("Game/Index").set((ID + 1)).then(() => {
			return db.ref("Id/"+did).once("value").then((temp) => {
				return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
					var Mid = userRecord.uid;
					return db.ref("Users/"+Mid).once("value").then((Snaper)=>{
						return db.ref("Game/"+ID).set({
							MaxP : mems,
							Status : "Wait Users",
							User1 : {
								id : Mid,
								name : Snaper.val()["Name"],
							},
						}).then(() => {
							return db.ref("Users/"+Mid+"/Status").set(ID).then(() => {
								if (Rand_p === true){
									return db.ref('Game/RandomG').push().set(ID).then(()=>{
										return({
											Status : "Successfull",
											Room : ID,
										})
									}).catch(cerr);
								}
								else{
									return({
										Status : "Successfull",
										Room : ID,
									})
								}
							}).catch(cerr)
						}).catch(cerr)
					}).catch(cerr)
				}).catch(cerr)
			}).catch(cerr)
		}).catch(cerr)
	}).catch(cerr)
})

exports.gameInvite = functions.https.onCall((req, res) => {
	var dev_id = req["id"];
	var fdn = req["fid"];
	var db = admin.database();
	var cerr = (err)=>{
		return {
			Status : err.message,
		};
	}
	return db.ref("Id/"+dev_id).once("value").then((temp) => {
		return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
			var mid = userRecord.uid;
			return db.ref("Users").orderByChild("Name").equalTo(fdn).once("value").then((snap) => {
				var index = Object.keys(snap.val());
				if (index.length === 1){
					var fid =index[0];
					return db.ref("Users/" + mid + "/Status").once("value").then((snapshot) => {
						if(snapshot.val() !== "idle"){
							var gameid = snapshot.val();
							return db.ref("Users/" + fid + "/Request/Game").push().set({
								uid : mid,
								gid : gameid,
						}).then(() =>{
								return db.ref("Notification/Game").push().set({
									sid : mid,
									rid : fid
								}).then(() => {
									return{
										Status : "Successfull",
									}
								}).catch(cerr)
							}).catch(cerr)
						}
						else{
							return ({
								Status : "Unexpected Error",
							});
						}
					}).catch(cerr)
				}
				else{
					return ({
						Status : "Unexpected Error",
					});
				}
			}).catch(cerr)
		}).catch(cerr)
	}).catch(cerr)
})

function room_Join(uid, gid){
	var db = admin.database();
	var cerr = (err)=>{
		return ({
			Status : err.message,
		});
	}
	return db.ref("Game/"+gid).once("value").then((valueG) => {
		var Data = valueG.val();
		if (Data["Status"] === "Wait Users"){
			var index = Data["MaxP"];
			var cnt = 0;
			var path = "User";
			var Already = true;
			var check = true;
			while(cnt < index){
				path = "User" + (cnt+1).toString();
				if (Data[path]){
					if(Data[path]["id"] === uid){
						Already = false;
						break;
					}
					cnt = cnt + 1;
				}
				else{
					check = false;
					break;
				}
			}
			if(check){
				if(Already){
					return{
						Status : "Sorry, This Room Is Full."
					}
				}
				else{
					return{
						Status : "You Already Exsist In This Room"
					}
				}
			}
			else{
				return db.ref("Users/"+uid).once("value").then((snapX)=>{
					return db.ref("Game/" + gid + "/" + path).update({
						name : snapX.val()["Name"],
						id : uid,
					}).then(() => {
						return db.ref("Users/" + uid).update({
							Status : gid,
						}).then(() => {
							game_Conversion(gid);
							return{
								Status : "Successfull",
								Action : "Game"
							}
						}).catch(cerr)
					}).catch(cerr)
				}).catch(cerr)
				
			}
		}
		else{
			if (Data["Status"] === "Playing"){
				return{
					Status : "Sorry, This Room Is Being Played."
				}
			}
			else{
				return{
					Status : "Sorry, This Room Is Ended."
				}
			}
		}
	}).catch(cerr)
}

exports.roomJoin = functions.https.onCall((req, res) => {
	var dev_id = req["id"];
	var rid = req["rid"];
	var db = admin.database();
	var cerr = (err)=>{
		return ({
			Status : err.message,
		});
	}
	return db.ref("Id/"+dev_id).once("value").then((temp) => {
		return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
			return room_Join(userRecord.uid, rid)
		}).catch(cerr)
	}).catch(cerr)
})

exports.acceptReq = functions.https.onCall((req, res) => {
	var dev_id = req["id"];
	var pid = req["pid"];
	var db = admin.database();
	var cerr = (err)=>{
		res.status(200).send(err.message);
		return ({
			Status : err.message,
		});
	}
	return db.ref("Id/"+dev_id).once("value").then((temp) => {
		return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
			var mid = userRecord.uid;
			return db.ref("Users").once("value").then((snap) => {
				var fcheck = false;
				var gcheck = false;
				var fcindex = [];
				var gindex = [];
				if(snap.val()[mid]["Request"]["Friend"]){
					fcindex = Object.keys(snap.val()[mid]["Request"]["Friend"]);
					fcheck = true;
				}
				if(snap.val()[mid]["Request"]["Game"]){
					gindex = Object.keys(snap.val()[mid]["Request"]["Game"]);
					gcheck = true;
				}
				if (fcheck === true || gcheck === true){
					if(fcindex.includes(pid) === true && gindex.includes(pid) === false){
						var fid = snap.val()[mid]["Request"]["Friend"][pid];
						var findex = snap.val()[fid]["Friends"]["i"];
						var mindex = snap.val()[mid]["Friends"]["i"];
						var check = true;
						var cnt = 0;
						while(cnt < mindex){
							if (fid === snap.val()[mid]["Friends"][cnt]){
								check = false;
								break;
							}
							cnt = cnt + 1;
						}
						if(check){
							var x = mindex + 1;
							return db.ref("Users/" + mid + "/Friends/i").set(x).then(() => {
								x = mindex.toString();
								return db.ref("Users/" + mid + "/Friends/"+x).set(fid).then(() => {
									x = findex + 1;
									return db.ref("Users/" + fid + "/Friends/i").set(x).then(() => {
										x = findex.toString();
										return db.ref("Users/" + fid + "/Friends/"+x).set(mid).then(() => {
											return db.ref("Users/"+mid+"/Request/Friend/"+pid).set(null).then(() => {
												return{
													Status : "Successfull",
													Action : "Friends"
												}
											}).catch(cerr)
										}).catch(cerr)
									}).catch(cerr)
								}).catch(cerr)
							}).catch(cerr)
						}
						else{
							return db.ref("Users/"+mid+"/Request/Friend/"+pid).set(null).then(() => {
								return{
									Status : "You are Already Friends",
								}
							}).catch(cerr)
						}
					}
					else if(fcindex.includes(pid) === false && gindex.includes(pid) === true){
						return db.ref("Users/"+mid+"/Request/Game/"+pid).once("value").then((value) => {
							var fidg = value.val()["uid"];
							var tempx = value.val()["gid"];
							return db.ref("Users/"+mid+"/Request/Game/"+pid).set(null).then(() => {
								if(snap.val()[fidg]["Status"] === tempx){
									return room_Join(mid, value.val()["gid"])
								}
								else{
									return{
										Status : "Sorry, Your Friend left Room",
									}
								}
							}).catch(cerr)
						}).catch(cerr)
					}
					else {
						return{
							Status : "Sorry, Cannot find Request",
						}
					}
				}
				else{
					return "Unexpected Error";
				}
			}).catch(cerr)
		}).catch(cerr)
	}).catch(cerr)
})

exports.denyReq = functions.https.onCall((req, res) => {
	var dev_id = req["id"];
	var pid = req["pid"];
	var db = admin.database();
	var cerr = (err)=>{
		return ({
			Status : err.message,
		});
	}
	return db.ref("Id/"+dev_id).once("value").then((temp) => {
		return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
			var mid = userRecord.uid;
			return db.ref("Users/"+mid).once("value").then((snap) => {
				if (snap.val()["Request"]){
					var data = snap.val()["Request"];
					if (data["Friend"][pid]) {
						return db.ref("Users/"+mid+"/Request/Friend/"+pid).set(null).then(() => {
							return{
								Status : "Successfull"
							}
						}).catch(cerr)
					}
					else if (data["Game"][pid]){
						return db.ref("Users/"+mid+"/Request/Game/"+pid).set(null).then(() => {
							return{
								Status : "Successfull"
							}
						}).catch(cerr)
					}
					else {
						 return{
							Status : "dsvhbjns"
						}
					}
				}
				else{
					return{
						Status : "dsvhbjns"
					}
				}
			}).catch(cerr)
		}).catch(cerr)
	}).catch(cerr)
})

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function setExpiry(gid){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	var now = Date.now() + 30000;
	db.ref("Game/" + gid).update({
		Expiry : now,
	}).catch(cerr);
}

function change_Player(gid, uN, Round){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	db.ref("Game/" + gid).update({
		Chance : uN,
		Round : Round,
	}).then(() => {
		setExpiry(gid);
		return
	}).catch(cerr)
}

function card_Distribute(people, gameid){
	var db = admin.database();
	var cerr = (err)=>{
		db.ref("err").set(err.message);
		return ({Status : err.message});
	}
	var cards = [];
	var i = 1;
	while(i < 53){
		cards.push(i);
		i = i+1;
	}
	cards = shuffle(cards);
	cards = shuffle(cards);
	i =0;
	var max = people;
	db.ref("Game/"+gameid).update({
		Status: "Playing",
	}).then(() => {
		return "data"
	}).catch(cerr)
	var cnt = 0;
	var path="";
	var C1 = [];
	var C2 = [];
	while(cnt<max){
		C1.push(cards[0]);
		C2.push(cards[max]);
		cnt = cnt + 1;
		cards.splice(max, 1);
		cards.splice(0, 1);
		
	}
	cnt = 0;
	while(cnt<max){
		path = "User" + (cnt+1).toString();
		db.ref("Game/"+gameid+"/"+path+"/Data").update({
			C1 : C1[cnt],
			C2 : C2[cnt]
		}).then(() => {
			return("done")
		}).catch(cerr)
		cnt = cnt + 1;
	}
	C1 = cards[2];
	C2 = cards[4];
	var C3 = cards[6];
	var C4 = cards[8];
	var C5 = cards[10];
	var pot = max*20;
	db.ref("Game/"+gameid).update({
		Pot : pot,
		C1 : C1,
		C2 : C2,
		C3 : C3,
		C4 : C4,
		C5 : C5
	}).then(() => {
		takeBoot(gameid);
		return("done")
	}).catch(cerr)
}
function game_Conversion(gid){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	db.ref('Game/'+gid).once("value").then((snap) => {
		Data = snap.val();
		if(gid !== "Index"){
			var max = Data["MaxP"];
			var check = true;
			var cnt = 0;
			var path="";
			while(cnt<max){
				path = "User" + (cnt+1).toString();
				if(Data[path]){
					cnt = cnt + 1;
				}
				else{
					check = false;
					break;
				}
			}
			if(check){
				if (Data["Status"] === "Wait Users"){
					takeBootE(gid);
					card_Distribute(max,gid);
					change_Player(gid, "User1", 1);
				}
			}
		}
		return
	}).catch(cerr)
}
/*exports.gameMaintain = functions.database.ref("Game/{mgid}").onUpdate((change, context) => {
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	var gid = context.params.mgid;
	var Data = change.after.val();
	if(gid !== "Index"){
		var max = Data["MaxP"];
		var check = true
		var cnt = 0;
		var path="";
		while(cnt<max){
			path = "User" + (cnt+1).toString();
			if(Data[path]){
				cnt = cnt + 1;
			}
			else{
				check = false;
				break;
			}
		}
		if(check){
			if (Data["Status"] === "Wait Users"){
				takeBootE(gid);
				card_Distribute(max,gid);
				change_Player(gid, "User1", 1);
			}
		}
	}
})
*/

function makeFold(No, gid){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	db.ref("Game/" + gid + "/" + No).update({
		1 : "Fold",
		2 : "Fold",
		3 : "Fold",
	}).then((value) => {
		return Evaluate(gid, No)
	}).catch(cerr)
}

function setWinner(gid, uData){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	return db.ref("Game/"+gid).once("value").then((snap) => {
		return db.ref("Users").once("value").then((valueG) => {
			var Data = [];
			var uids = [];
			var temp = 0;
			var mData = {};
			var cnt = 0;
			while(cnt < uData.length){
				uids.push(snap.val()[uData[cnt]]["id"]);
				cnt = cnt + 1;
			}
			cnt = 0;
			var pot = snap.val()["Pot"];
			pot = pot /uData.length;
			while(cnt < uids.length){
				Data.push(valueG.val()[uids[cnt]]["Name"]);
				temp = valueG.val()[uids[cnt]]["Chips"] + pot;
				var abc = valueG.val()[uids[cnt]]["Data"]["Won"] + 1;
				mData[uids[cnt]] = Object.assign(valueG.val()[uids[cnt]],{Chips : temp});
				mData[uids[cnt]]["Data"]["Won"] = abc;
				cnt = cnt + 1;
			}
			return db.ref("Users").update(mData).then(() =>{
				return db.ref("Game/"+gid).update({
					Pot : 0,
					Winner : Data,
					Round : "Voting",
					Chance : 0,
				}).then(() => {
					return"Done";
				}).catch(cerr)
			}).catch(cerr);
		}).catch(cerr)
	}).catch(cerr)
}

function Evaluate(gid, uN){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	db.ref("Game/"+gid).once("value").then((snap) => {
		var Cround = snap.val()["Round"];
		var max = snap.val()["MaxP"];
		change_Player(gid, "Evaluating", Cround);
		var path = "";
		uN = uN.replace("User", "");
		uN = Number(uN);
		var cnt = 1;
		var DataU = [];
		var DataC = [];
		var DataN = [];
		var fold = 0;
		var temp = "";
		var next = false;
		while(max > (cnt-1)){
			path = "User" + cnt.toString();
			cnt = cnt + 1;
			if(snap.val()[path].hasOwnProperty(Cround)){
				if(snap.val()[path][Cround] === "Fold"){
					fold = fold + 1;
				}
				else if (snap.val()[path][Cround]["All"] !== true){
					DataU.push(path);
					DataC.push(snap.val()[path][Cround]);
				}
				else{
					DataU.push(path);
					DataC.push(snap.val()[path][Cround]["Amount"]);
					DataN.push(path);
				}
			}
			else{
				DataU.push(path);
				DataC.push(snap.val()[path][Cround]);
				next = true;
				break;
			}
		}
		if(fold === (max-1)){
			setWinner(gid, [DataU[0]]);
		}
		else if((fold + DataN.length) === max){
			findW(gid);
		}
		else if(next){
			change_Player(gid, path, Cround);
		}
		else{
			cnt = 0;
			fold = 0;
			next = 0;
			var largest = Math.max(...DataC);
			var largestU = -1;
			var isAll = false;
			while(DataC.length > cnt){
				if(DataC[cnt] === largest){
					DataC.splice(cnt, 1)
					DataU.splice(cnt, 1)
				}
				else{
					cnt = cnt + 1;
				}
			}
			if(DataC.length !== 0){
				fold = uN;
				uN = uN + 1;
				path = "";
				largestU = true;
				while(largestU){
					if(uN > max){
						uN = uN - max;
					}
					if(uN === fold){
						break;
					}
					isAll = false;
					path = "User" + uN.toString();
					next = 0;
					while(next < DataU.length){
						if(DataU[next] === path){
							isAll = true;
							break;
						}
						next = next + 1;
					}
					if(isAll){
						break;
					}
					uN = uN + 1;
				}
				change_Player(gid, path, Cround);
			}
			else{
				if(Cround === 3){
					findW(gid);
				}
				else{
					cnt = 1;
					Cround = Cround + 1;
					path = "";
					while(cnt-1 < max){
						path = "User" + cnt.toString();
						if(snap.val()[path][Cround]){
							cnt = cnt + 1;
						}
						else{
							break;
						}
					}
					change_Player(gid, path, Cround);
				}
			}
			
		}
		return
	}).catch(cerr)
}

function setRank(Rank){
	var color = 0;
	var rc = 0;
	var cnt = 0;
	var temp = [];
	while(cnt < Rank.length){
		if(Rank[cnt] > 38){
			color = "Diamond";
			rc = (Rank[cnt]%13)+1;
		}
		else if(Rank[cnt] > 25){
			color = "Club";
			rc = (Rank[cnt]%13)+1;
		}
		else if(Rank[cnt] > 12){
			color = "Spade";
			rc = (Rank[cnt]%13)+1;
		}
		else{
			color = "Heart";
			rc = (Rank[cnt]%13)+1;
		}
		cnt = cnt + 1;
		temp.push({
			Color : color,
			Rank : rc,
		})
	}
	return temp;
}

function flushCheck(Cards){
	var spade=[];
	var heart=[];
	var club=[];
	var diamond=[];
	var i =0;
	var path = "";
	while(i<Cards.length){
		path = "C" + (i+1).toString()
		if(Cards[i] === "Diamond"){
			diamond.push(path);
		}
		else if(Cards[i] === "Heart"){
			heart.push(path);
		}
		else if(Cards[i] === "Spade"){
			spade.push(path);
		}
		else if(Cards[i] === "Club"){
			club.push(path);
		}
		i = i + 1;
	}
	path = false;
	if(spade.length > 4){
		path = true;
	}
	else if(diamond.length > 4){
		path = true;
	}
	else if(heart.length > 4){
		path = true;
	}
	else if(club.length > 4){
		path = true;
	}
	else{
		path = false;
	}
	return{
		Club : club,
		Spade : spade,
		Heart : heart,
		diamond : diamond,
		Check : path 
	}
}

function highCheck(Cards){
	if(Cards[0]=== 1 || 1 === Cards[1]){
		return 14;
	}
	else if(Cards[0]>Cards[1]){
		return(Cards[0]);
	}
	else{
		return(Cards[1]);
	}
}

function pairCheck(Cards){
	var Ace=0;
	var King=0;
	var Queen=0;
	var Jack=0;
	var no2=0;
	var no3=0;
	var no4=0;
	var no5=0;
	var no6=0;
	var no7=0;
	var no8=0;
	var no9=0;
	var no10=0;
	var i =0;
	var path = "";
	while(i<Cards.length){
		if(Cards[i] === 1){
			Ace = Ace + 1;
		}
		else if(Cards[i] === 13){
			King = King + 1;
		}
		else if(Cards[i] === 12){
			Queen = Queen + 1;
		}
		else if(Cards[i] === 11){
			Jack = Jack + 1;
		}
		else if(Cards[i] === 10){
			no10 = no10 + 1;
		}
		else if(Cards[i] === 9){
			no9 = no9 + 1;
		}
		else if(Cards[i] === 8){
			no8 = no8 + 1;
		}
		else if(Cards[i] === 7){
			no7 = no7 + 1;
		}
		else if(Cards[i] === 6){
			no6 = no6 + 1;
		}
		else if(Cards[i] === 5){
			no5 = no5 + 1;
		}
		else if(Cards[i] === 4){
			no4 = no4 + 1;
		}
		else if(Cards[i] === 3){
			no3 = no3 + 1;
		}
		else if(Cards[i] === 2){
			no2 = no2 + 1;
		}
		i = i + 1;
	}
	path = [];
	i = 0;
	var data = [Ace, King, Queen, Jack, no10, no2, no3, no4, no5, no6, no7, no8, no9]
	while(i < data.length){
		if(data[i] > 0){
			path.push(data[i]);
		}
		i = i + 1;
	}
	King = 0;
	Queen = 0;
	Jack = 0;
	Ace = 0;
	i = 0;
	while(i < path.length){
		if(path[i] > 3){
			King = King +1;
		}
		else if(path[i] > 2){
			Queen = Queen +1;
		}
		else if(path[i] > 1){
			Jack = Jack +1;
		}
		else{
			Ace = Ace +1;
		}
		i = i + 1;
	}
	return {
		Pair4 : King,
		Pair3 : Queen,
		Pair2 : Jack,
		Single : Ace,
		abc : path
	}
}

function straightCheck(Cards){
	var path = [];
	var temp = [];
	var i = 1;
	var x = 0;
	var cnt = 0;
	var Data = Cards;
	while(i<14){
		if(i === 10){
			i = i + 1;
		}
		x = i;
		temp.push(x);
		while(cnt < 4){
			x = x + 1;
			if(x > 13){
				x  = x - 13;
			}
			temp.push(x);
			cnt = cnt + 1;
		}
		path.push(temp);
		temp = [];
		cnt = 0;
		i = i + 1;
	}
	path.push([10,11,12,13,1]);
	path = path.reverse();
	cnt = 0;
	i = 0;
	x = 0;
	var check = 0;
	var s = 15;
	while(cnt < path.length){
		temp = path[cnt];
		while(i<temp.length){
			while(x < Data.length){
				if(temp[i] === Data[x]){
					temp[i] = 0;
					check = check + 1;
					if(Data[x] < s && Data[x] !== 1){
						s = Data[x];
					}
				}
				x = x +1;
			}
			i = i + 1;
			x = 0;
		}
		if(check > 4){
			break;
		}
		s = 15;
		check = 0;	
		x = 0;
		i = 0;
		cnt = cnt + 1;
	}
	i = false;
	if(check >4){
		cnt = true;
		if(s === 10){
			i =true;
		}
		else {
			i = false;
		}
	}
	else{
		cnt = false;
		i = false;
	}
	return({
		Straight : cnt,
		Royal : i,
	});
}

function gameRank(uN, no, gid){
	var C = [];
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	return db.ref("Game/"+gid).once("value").then((snap) => {
		C.push((snap.val()[uN]["Data"]["C1"]) - 1);
		C.push((snap.val()[uN]["Data"]["C2"]) - 1);
		C.push((snap.val()["C1"]) - 1);
		C.push((snap.val()["C2"]) - 1);
		C.push((snap.val()["C3"]) - 1);
		C.push((snap.val()["C4"]) - 1);
		C.push((snap.val()["C5"]) - 1);
		C = setRank(C);
		var i = 0;
		var suits = [];
		var ranks = [];
		if(no === 5){
			C[6]["Color"]=undefined;
			C[6]["Rank"]=undefined;
			C[5]["Color"]=undefined;
			C[5]["Rank"]=undefined;
		}
		else if(no === 6){
			C[6]["Color"]=undefined;
			C[6]["Rank"]=undefined;
		}
		while(i<C.length){
			suits.push(C[i]["Color"]);
			ranks.push(C[i]["Rank"]);
			i = i +1;
		}
		var fl = flushCheck(suits);
		var st = straightCheck(ranks);
		var pa = pairCheck(ranks);
		i = 1;
		C = null;
		if(fl["Check"] === true && st["Royal"] === true){
			i = 10;
		}
		else if(fl["Check"] === true && st["Straight"] === true){
			i = 9;
		}
		else if(pa["Pair4"] > 0){
			i = 8;
		}
		else if(pa["Pair3"] > 0 && pa["Pair2"] > 0){
			i = 7;
		}
		else if(fl["Check"] === true){
			i = 6;
		}
		else if(st["Straight"] === true){
			i = 5;
		}
		else if(pa["Pair3"] > 0){
			i = 4;
			C = 0;
			C = highCheck(ranks);
		}
		else if(pa["Pair2"] > 1){
			i = 3;
			C = 0;
			C = highCheck(ranks);
		}
		else if(pa["Pair2"] > 0){
			i = 2;
			C = 0;
			C = highCheck(ranks);
		}
		else {
			i = 1;
			C = 0;
			C = highCheck(ranks);
		}
		db.ref("Game/"+gid+"/"+uN+"/Data/E").update({
			Result : i,
			High : C,
		});
		return "Done";
	}).catch(cerr);
}

function takeBoot(gid){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	var path = "";
	db.ref("Game/"+gid).once("value").then((valueG) => {
		mems = valueG.val()["MaxP"];
		var Chipsx = 0;
		var uid = "";
		return db.ref("Users").once("value").then((snap) =>{
			var i = 1;
			var Data = snap.val();
			var temp = {};
			while(mems > (i-1)){
				path = "User"+i.toString();
				uid = valueG.val()[path]["id"];
				Chipsx = Data[uid]["Chips"];
				Chipsx = Chipsx - 20;
				var syz = Data[uid]["Data"]["Played"] + 1;
				temp[uid] = Object.assign(Data[uid],{Chips : Chipsx});
				temp[uid]["Data"]["Played"] = syz;
				i = i + 1;
			}
			db.ref("Users").update(temp).catch(cerr);
			return
		}).catch(cerr)
	}).catch(cerr)
}

function takeBootE(gid){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	var path = "";
	db.ref("Game/"+gid).once("value").then((valueG) => {
		mems = valueG.val()["MaxP"];
		var Chipsx = 0;
		var uid = "";
		return db.ref("Users").once("value").then((snap) =>{
			var i = 1;
			var Data = snap.val();
			var temp = {};
			while(mems > (i-1)){
				path = "User"+i.toString();
				uid = valueG.val()[path]["id"];
				Chipsx = Data[uid]["Chips"];
				Chipsx = Chipsx - 20;
				temp[uid] = Object.assign(Data[uid],{Chips : Chipsx});
				i = i + 1;
			}
			db.ref("Users").update(temp).catch(cerr);
			return
		}).catch(cerr)
	}).catch(cerr)
}

exports.checkExpiry = functions.https.onCall((req, res) => {
	var db = admin.database();
	var gid = req["gid"];
	var uid = req["uid"];
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	var i = Date.now();
	return db.ref("Game/" + gid).once("value").then((snap)=>{
		if(uid !== snap.val()["Chance"]){
			return
		}
		if(i >= snap.val()["Expiry"]){
			makeFold(uid, gid);
			return
		}
		else{
			return
		}
	}).catch(cerr);
})

exports.raiseBid = functions.https.onCall((req, res) => {
	var gid = req["gid"];
	var uN = req["id"];
	var Amount = req["amount"];
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	return db.ref("Game/"+ gid).once("value").then((snap) => {
		var cnt = 1;
		var max = snap.val()["MaxP"];
		var Cround = snap.val()["Round"];
		var high = 0;
		var path = "";
		var DataC = 0;
		var temp = [];
		while((cnt - 1) < max){
			path = "User" + cnt.toString();
			if(snap.val()[path][Cround]){
				if(snap.val()[path][Cround] !== "Fold"){
					if(snap.val()[path][Cround]["All"]){
						DataC = snap.val()[path][Cround]["Amount"];
						temp.push(path);
					}
					else{
						DataC=snap.val()[path][Cround];
					}
					if(high <DataC){
						high = DataC;
					}

				}
			}
			cnt = cnt + 1;
		}
		var uid = snap.val()[uN]["id"];
		if(high > Amount){
			return({Status : "Your Raised amount is less than highest bid"});
		}
		else{
			high = Amount;
			return db.ref("Users/"+uid).once("value").then((valueF)=>{
				var Chipsx = valueF.val()["Chips"];
				var pot = high + snap.val()["Pot"];
				if(Chipsx > high){
					Chipsx = Chipsx -high;
					return db.ref("Users/"+uid).update({Chips : Chipsx}).then(() => {
						return db.ref("Game/"+gid).update({Pot : pot}).then(() => {
							return db.ref("Game/" + gid + "/" + uN + "/" + Cround).set(high).then(() => {
								var x = {
									1:{
										All : true,
										Amount : high
									},
									2:{
										All : true,
										Amount : high
									},
									3:{
										All : true,
										Amount : high
									},
								};
								var abc = {};
								var cnt = 0;
								var Data = {};
								while(cnt < temp.length){
									abc = snap.val()[temp[cnt]];
									Data[temp[cnt]] = Object.assign(abc, x);
									cnt = cnt + 1;
								}
								db.ref("Game/"+gid).update(Data);
								Evaluate(gid, uN);
								return({Status : "Successfull"})
							}).catch(cerr)
						}).catch(cerr)
					}).catch(cerr)
				}
				else{
					return({Status : "You need to select All-In"});
				}
			}).catch(cerr)
		}
	}).catch(cerr)
})

exports.returnData = functions.https.onCall((req,res) => {
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	var dev_id = req['id'];
	return db.ref("Id/"+dev_id).once("value").then((temp) => {
		return admin.auth().getUserByEmail(temp.val()["id"]).then((userRecord) => {
			var id = userRecord.uid;
			return db.ref("Users").once("value").then((snap) =>{
				var temp = snap.val()[id]["Status"];
				if(temp === "idle"){
					return {
						Status : "Successfull",
						name : snap.val()[id]["Name"],
						chips : snap.val()[id]["Chips"],
						won : snap.val()[id]["Data"]["Won"],
						played : snap.val()[id]["Data"]["Played"],
					}
				}
				else{
					return db.ref("Game/" + temp).once("value").then((valueG) => {
						var Gstatus = valueG.val()["Status"];
						var cnt = 1;
						var mid = "";
						var path = "";
						var Users = {};
						var x = "";
						var Cround = {};
						if(Gstatus === "Playing"){
							Cround = valueG.val()["Round"];
							if(Cround === "Voting"){
								Users = [];
								cnt = 0;
								while(cnt < 9){
									if(valueG.val()["Winner"].hasOwnProperty(cnt)){
										Users.push(valueG.val()["Winner"]);
									}
									else{
										break;
									}
									cnt = cnt + 1;
								}
								return({
									Status : "Game",
									GameId : temp,
									GameStatus : "Voting",
									Winner : Users,
								})
							}
							var Cards = [];
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
							while((cnt-1) < valueG.val()["MaxP"]){
								path = "User" + cnt.toString();
								cnt = cnt +1;
								if(valueG.val()[path]["id"] === id){
									mid = path;
								}
								x = valueG.val()[path]["id"]
								Users[path] = {
									Name : snap.val()[x]["Name"],
									Play : valueG.val()[path][Cround]
								}
							}
							if(mid !== valueG.val()["Chance"]){
								cnt = Number(mid.slice(4)) * 1000;
								cnt = cnt + valueG.val()["Expiry"];
							}
							Cards.push(valueG.val()[mid]["Data"]["C1"]);
							Cards.push(valueG.val()[mid]["Data"]["C2"]);
							return gameRank(mid, (Cround + 4), temp).then(() => {
								return db.ref("Game/" + temp+"/"+mid+"/Data/E").once("value").then((valueF) => {
									return({
										Status : "Game",
										Cards : Cards,
										Udata : Users,
										Round : Cround,
										GameStatus : Gstatus,
										Mid : mid,
										Chips : snap.val()[id]["Chips"],
										GameId : temp,
										Chance : valueG.val()["Chance"],
										Evaluate : valueF.val(),
										Pot : valueG.val()["Pot"],
										Max : valueG.val()["MaxP"],
									})
								}).catch(cerr)
							}).catch(cerr)
						}
						else if(Gstatus === "Wait Users"){
							while((cnt-1) < valueG.val()["MaxP"]){
								path = "User" + cnt.toString();
								cnt = cnt +1;
								if(valueG.val()[path]){
									if(valueG.val()[path]["id"] === id){
										mid = path;
									}
									x = valueG.val()[path]["id"];
									Users[path] = {
										Name : snap.val()[x]["Name"]
									}
								}
								else{
									Users[path] ={
										Name : null,
									}
								}
							}
							return({
								Status : "Game",
								Udata : Users,
								GameStatus : Gstatus,
								Mid : mid,
								GameId : temp,
								Max : valueG.val()["MaxP"],
							})
						}
						else{
							db.ref("Users/" + id).update({Status : "idle"})
							return {
								Status : "Successfull",
								name : snap.val()[id]["Name"],
								chips : snap.val()[id]["Chips"],
								won : snap.val()[id]["Data"]["Won"],
								played : snap.val()[id]["Data"]["Played"],
							}
						}
					}).catch(cerr)
				}
			}).catch(cerr)
		}).catch(cerr)
	}).catch(cerr)
})

exports.voteGame = functions.https.onCall((req, res) => {
	var db = admin.database();
	var cerr = (err)=>{
		res.status(200).send({Status : err.message});
	}
	var gid = 1;
	return db.ref("Game/"+gid).once("value").then((snap) => {
		var max = snap.val()["MaxP"];
		var Chance = snap.val()["Chance"] + 1;
		var Data = snap.val();
		var cnt = 1;
		var path = "";
		if(Chance === max){
			Data["Winner"] = null;
			while((cnt-1) < max){
				path = "User" + cnt.toString();
				cnt = cnt + 1;
				Data[path] = {
					id : snap.val()[path]["id"],
				};
			}
			db.ref("Game/"+gid).update(Data).then(()=>{
				card_Distribute(max, gid);
				change_Player(gid, "User1", 1);
				return
			}).catch(cerr)
		}
		else {
			db.ref("Game/"+gid).update({"Chance" : Chance}).then(()=>{
				return
			}).catch(cerr)
		}
		return({Status : "Sucessfull"});
	}).catch(cerr)
})

exports.Test = functions.https.onRequest((req, res) => {
	var db = admin.database();
	var cerr = (err)=>{
		res.status(200).send(err.message)
		return ({Status : err.message});
	}
	db.ref("abc").once("value").then((snapi) => {
		var gid = snapi.val()["1"];
		var id = snapi.val()["2"];
		Evaluate(gid, id);
		res.status(200).send("Done");
		return;
	}).catch(cerr)
})

exports.voteRGame = functions.https.onCall((req, res) => {
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	var gid = req["gid"];
	return db.ref("Game/"+gid).once("value").then((snap) => {
		db.ref("Game/"+gid).set({
			Status : "END",
			Chance : "END",
			Round : "END",
			Winner : snap.val()["Winner"],
		})
		return({Status : "Sucessfull"});
	}).catch(cerr)
})


exports.allBid = functions.https.onCall((req,res) => {
	return All(req["gid"], req["uid"])
})

exports.foldBid = functions.https.onCall((req, res) => {
	return makeFold(req["uid"], req["gid"])
})

exports.callBid = functions.https.onCall((req, res) => {
	checkCall(req["gid"], req["uid"]);
	
})

function checkCall(gid, uN){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	return db.ref("Game/"+ gid).once("value").then((snap) => {
		var cnt = 1;
		var max = snap.val()["MaxP"];
		var Cround = snap.val()["Round"];
		var high = 0;
		var path = "";
		var DataC = 0;
		while((cnt - 1) < max){
			path = "User" + cnt.toString();
			if(snap.val()[path][Cround]){
				if(snap.val()[path][Cround] !== "Fold"){
					if(snap.val()[path][Cround]["All"]){
						DataC = snap.val()[path][Cround]["Amount"];
					}
					else{
						DataC=snap.val()[path][Cround];
					}
					if(high <DataC){
						high = DataC;
					}

				}
			}
			cnt = cnt + 1;
		}
		var uid = snap.val()[uN]["id"];
		return db.ref("Users/"+uid).once("value").then((valueF)=>{
			var Chipsx = valueF.val()["Chips"];
			var pot = high + snap.val()["Pot"];
			if(Chipsx > high){
				Chipsx = Chipsx -high;
				return db.ref("Users/"+uid).update({Chips : Chipsx}).then(() => {
					var Data = snap.val();
					Data["Pot"] = pot;
					Data[uN][Cround] = high
					return db.ref("Game/"+gid).update(Data).then(() => {
						return Evaluate(gid, uN);
					}).catch(cerr)
				}).catch(cerr)
			}
			else{
				All(gid, uN);
				return 
			}
		})
	}).catch(cerr)
}

function findW(gid){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	return db.ref("Game/"+gid).once("value").then((snap) => {
		var cnt = 1;
		var max = snap.val()["MaxP"];
		var path = "";
		var high = 0;
		var Users = [];
		var UsersH = [];
		while((cnt-1) < max){
			path = "User" + cnt.toString(); 
			cnt = cnt +1;
			if(snap.val()[path]["1"] !== "Fold"){
				if(high < snap.val()[path]["Data"]["E"]["Result"]){
					high = snap.val()[path]["Data"]["E"]["Result"];
					Users = [path];
					UsersH = [];
					if(high < 5){
						UsersH = [snap.val()[path]["Data"]["E"]["High"]];
					}
					
				}
				else if (snap.val()[path]["Data"]["E"]["Result"] === high){
					Users.push(path);
					if(high < 5){
						UsersH.push(snap.val()[path]["Data"]["E"]["High"]);
					}
				}
			}
		}
		if(Users.length > 1 && high < 5){
			cnt = 0;
			high = 0;
			var Data = [];
			while(cnt < Users.length){
				if(high < UsersH[cnt]){
					high = UsersH[cnt];
					Data = [];
					Data.push(Users[cnt]);
				}
				else if(high === UsersH[cnt]){
					Data.push(Users[cnt]);
				}
				cnt = cnt + 1;
			}
			Users = Data
		}
		setWinner(gid, Users);
		change_Player(gid, 0, "Voting");
		return
	}).catch(cerr)
}

function All(gid, uN){
	var db = admin.database();
	var cerr = (err)=>{
		return ({Status : err.message});
	}
	return db.ref("Game/" + gid).once("value").then((snap) => {
		var DataC = [];
		var cnt = 1;
		var max = snap.val()["MaxP"];
		var path = "";
		var temp = [];
		var Cround = snap.val()["Round"];
		while((cnt - 1) < max){
			path = "User" + cnt.toString();
			if(snap.val()[path][Cround]){
				if(snap.val()[path][Cround] !== "Fold"){
					if(snap.val()[path][Cround]["All"]){
						DataC.push(snap.val()[path][Cround]["Amount"]);
						temp.push(path);
					}
					else{
						DataC.push(snap.val()[path][Cround]);
					}
				}
			}
			cnt = cnt + 1;
		}
		temp.push(uN);
		DataC = Math.max(...DataC);
		var uid = snap.val()[uN]["id"];
		return db.ref("Users/"+uid).once("value").then((valueF) =>{
			var Chipsx = valueF.val()["Chips"];
			var pot = Chipsx + snap.val()["Pot"];
			if(DataC < Chipsx){
				var Data = {};
				cnt = 0;
				var abc = {};
				var x = {
					1 : {
						All : true,
						Amount : Chipsx
					},
					2 : {
						All : true,
						Amount : Chipsx
					},
					3 : {
						All : true,
						Amount : Chipsx
					}
				};
				while(cnt < temp.length){
					abc = snap.val()[temp[cnt]];
					Data[temp[cnt]] = Object.assign(abc, x);
					cnt = cnt + 1
				}
				db.ref("Game/"+gid).update(Data);
			}
			else{
				db.ref("Game/"+gid+"/"+uN).update({
					1 : {
						All : true,
						Amount : DataC
					},
					2 : {
						All : true,
						Amount : DataC
					},
					3 : {
						All : true,
						Amount : DataC
					},
				}).catch(cerr)
			}
			return db.ref("Game/"+gid).update({Pot : pot}).then(() => {
				Evaluate(gid, uN);
				db.ref("Users/" + uid).update({Chips : 0}).catch(cerr);
				return
			}).catch(cerr)
		}).catch(cerr)
	}).catch(cerr)
}

