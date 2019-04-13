const fs = require('fs');
const mysql=require("mysql");
const util = require("util");
module.exports=
class BDT1{
	constructor(){
		this.con = mysql.createConnection({
		  host: "localhost",
		  user: "node",
		  password: "node",
		  database:"bd2t"
		});
		this.query = util.promisify(this.con.query).bind(this.con);
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
	async page(req,res,next){
		let queries=[];
		let descriptions=[];
		JSON.parse(fs.readFileSync("queries.json","utf-8")).data.forEach((d)=>{
			queries.push(d[0]);
			descriptions.push(d[1]);
		});
		let tables=JSON.parse(fs.readFileSync("tables.json","utf-8")).data;
		let insertQueries=JSON.parse(fs.readFileSync("insertQueries.json","utf-8")).data;
		let css=fs.readFileSync("style.css","utf-8");
		let header=fs.readFileSync("header.html","utf-8");
		let footer=fs.readFileSync("footer.html","utf-8");
		res.write("<style>"+css+"</style>");
		res.write(header);
		res.write("<b>Tabelas</b><br>");
		tables.forEach((elem)=>{
			try{
				elem=elem.split("(");
				elem[0]="<b>"+elem[0]+"</b>";
				elem=elem.join("(");
			}catch(e){
				elem=elem.join("(");
			}
			res.write("<span id='querytable'>"+elem+"</span><br>");
		});
		res.write("<br><br>");
		res.write("<span id='title'><b>$n consultas mysql para as tabelas acima</b><br></span>".replace("$n",queries.length));
		for(let i=0;i<queries.length;i++){
			let sql=queries[i];
			let description=descriptions[i];
			res.write("<span id='queryi'>"+(i+1)+")</span><br>");
			res.write("<span id='queryd'><b>Descrição: </b>"+description+"</span><br>");
			res.write("<b>SQL: </b><span id='query'><i>"+sql+"</i></span><br>");
			res.write("<b>Resultado:</b>");
			let rows = null;
			try{
				rows=await this.query(sql);
			}catch(e){console.log(e.sqlMessage);}
			if(rows==null){
				res.write(this.mat2html([["Erro SQL"]])+"<br><br>");
				continue;
			}
			if(rows.length==0){
				res.write(this.mat2html([["Tupla vazia"]])+"<br><br>");
				continue;
			}
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
			res.write(this.mat2html(mat)+"<br><br>");
		}
		res.write("<br><br>");
		res.write("<b>Extras - consultas para inserir tuplas nas tabelas:</b><br><br>");
		insertQueries.forEach((elem)=>{
			res.write("<span id='insertQuerie'>"+elem+"</span><br>");
		});
		res.write(footer);
		res.end();
	}
}