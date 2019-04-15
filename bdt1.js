const fs = require('fs');
const mysql=require("mysql");
const util = require("util");
const sqlFormatter=require("sql-formatter").format;
module.exports=
class BDT1{
	constructor(){
		this.con = mysql.createConnection({
		  host: "localhost",
		  user: "node",
		  password: "node",
		  database:"bd2t",
		  dateStrings: true
		});
		this.query = util.promisify(this.con.query).bind(this.con);
	}
	async createTables(){
		let tables=JSON.parse(fs.readFileSync("tables.json","utf-8")).data;
		for(let tablename in tables){
			if(!tables.hasOwnProperty(tablename))continue;
			let sql="CREATE TABLE "+tablename+"("+tables[tablename].join(",")+")";
			try{
				await this.query(sql);
			}catch(e){
				console.log(e.sqlMessage);
				return;
			}
		}

	}
	mat2html(mat){
		let ans="<table>"
		mat.forEach((elemi,i)=>{
			ans+="<tr>"
			elemi.forEach((elemj,j)=>{
				if (i==0){
					ans+="<th>"+elemj+"</th>";
					return;
				}
				ans+="<td>"+elemj+"</td>";
			})
			ans+="</tr>";
		})
		return ans+"</table>";
	}
	async querytohtml(query){
		let rows = null;
		try{
			rows=await this.query(query);
		}catch(e){console.log("sql error for ("+query+") : "+e.sqlMessage);}
		
		if(rows==null)return this.mat2html([["Erro SQL"]]);
		if(rows.length==0)return this.mat2html([["Tupla vazia"]]);
		let mat=[[]];
		for(let k in rows[0]){
			if(!rows[0].hasOwnProperty(k))continue;
			mat[0].push(k);
		}
		rows.forEach((tup,tupi)=>{
			let temp=[]
			for(let k in tup){
				if(!tup.hasOwnProperty(k))continue;
				temp.push(tup[k]);
			}
			mat.push(temp);
		});
		return this.mat2html(mat);
	}
	async page(req,res,next){
		const readFile=(filename)=>{return fs.readFileSync(filename,"utf-8");}
		const readJsonFile=(filename)=>{return JSON.parse(readFile(filename));}
		let queries=[];
		let descriptions=[];
		readJsonFile("queries.json").data.forEach((d)=>{
			queries.push(d[0]);
			descriptions.push(d[1]);
		});
		let tables=       readJsonFile("tables.json").data;
		let insertQueries=readJsonFile("insertQueries.json").data;
		let css=          readFile("style.css");
		let header=       readFile("header.html");
		let footer=       readFile("footer.html");
		res.write("<style>"+css+"</style>");
		res.write(header);
		res.write("<b>Tabelas</b><br><br><hr><br>");
		for(let tablename in tables){
			if(!tables.hasOwnProperty(tablename))continue;
			res.write("<b>Nome da tabela:</b>"+tablename+"<br>");
			res.write("<b>Conteúdo:</b>");
			res.write((await this.querytohtml("SELECT * FROM "+tablename))+"<br><br>");
		}
		res.write("<hr><br><span id='title'><b>$n consultas mysql para as tabelas acima</b><br></span>".replace("$n",queries.length));
		for(let i=0;i<queries.length;i++){
			let sql=queries[i];
			let description=descriptions[i];
			res.write("<span id='queryi'>"+(i+1)+")</span><br>");
			res.write("<span id='queryd'><b>Descrição: </b>"+description+"</span><br>");
			res.write("<b>SQL: </b><br><span id='query'><i>"+sqlFormatter(sql).split("\n").join("<br>")+"</i></span><br>");
			res.write("<b>Resultado:</b>");
			res.write(await(this.querytohtml(sql))+"<br><br>");
		}
		res.write("<br><br>");
		res.write("<b>Extras - consultas para inserir tuplas nas tabelas:</b><br><br>");
		insertQueries.forEach((elem)=>{
			res.write("<span id='insertQuerie'>"+sqlFormatter(elem).split("\n").join("<br>")+"</span><br>");
		});
		res.write("<hr>");
		res.write(footer);
		res.end();
	}
}