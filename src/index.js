const express  = require ("express");
const env = require("dotenv");
const {db} = require("/AMD/SSQQLL/db/connection");
const body = require("body-parser")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

env.config()

const PORT = process.env.PORT ;
const JWT_SECRET = process.env.JWT_SECRET
const app = express()

// app.use(body.urlencoded({extended : true}))

app.use(express.json())

//Jwt(Json Web Token)
//Menggunakkan (Oauth 2)
const authenticateToken = (req,res,next) => {
    const setHeadr = req.headers ['authorization'];
    const token = setHeadr && setHeadr.split(" ")[1];
    if(!token){
        res.status(401).send("Token di butuhkan")
    }
    jwt.verify(token,JWT_SECRET,(err,result) => {
        if(err) {
            res.send("Token tidak valid")
        }
        req.result = result
        next()
    })

} 

//==Registrasi User==\\
//Endpoint:Registrasi
//Metode HTTP: POST
//Deskripsi: Mendaftarkan pengguna baru dengan informasi seperti email, password, nama, dan umur.
//Password yang dimasukkan oleh pengguna akan di-hash menggunakan bcrypt sebelum disimpan di database.
app.post("/Registrasi",async (req,res) => {
    const email = req.body.email
    const password = req.body.password
    const nama = req.body.nama
    const umur = req.body.umur
    const hashPassword =await bcrypt.hash(password,10)
    
    if(!email || !password || !nama || !umur){
        return res.status(400).send("Tidak Boleh ada yng kosong")
    }

    const value = [email,hashPassword,nama,umur]
    const query = "INSERT INTO login (email,password,nama,umur) VALUE (?,?,?,?)"

    db.query(query,value,(err,result) => {
        if(err) throw err
        res.send("Data Berhasil di tambahkan silahkan login kembali")
    })
})

//Login User\\
//Endpoint: /Login
//Metode HTTP: POST
//Deskripsi: Mengautentikasi pengguna berdasarkan email dan password. Jika autentikasi berhasil, 
//server akan mengirimkan token JWT yang dapat digunakan untuk mengakses endpoint lain yang dilindungi.
app.post("/Login",async (req,res) => {
    const email = req.body.email
    const password = req.body.password
    const value = [email,password]
    
    if(!email || !password) {
        return res.send("Email dan Password harus di isi")
    }
    
    const query = "SELECT * FROM login WHERE email = ? "
    try {
        db.query(query,value,(err,result) => {
            if (err) throw err
                console.log(result);
            if(result.length === 0){
                res.send("Email dan Password anda salah")
            }
                const user = result[0];

                const payload = {
                    id : user.id,
                    email : user.email,
                    nama : user.nama
                }

                const time = 60 * 60 * 1;

                const token = jwt.sign(payload,JWT_SECRET,{expiresIn : time})

                const valdPassword = bcrypt.compare(password,user.password)
                
                    if(valdPassword){
                        console.log("Login Berhasil")    
                        res.status(200).json({
                            token: token,
                            redirectTo: '/Members'
                        });
                        console.log({
                            token : token
                        })
                }else{
                    res.send("Password Salah")
                }
            })
        } catch (error) {
            res.send("login gagal")
        }
    })

app.get("/",(req,res) => {
    res.send("Hello World")
})


//Menampilkan Data
//Endpoint: /Members
//Metode HTTP: GET
//Deskripsi: Mengambil semua data anggota dari tabel clan. Hanya bisa diakses oleh pengguna yang telah terautentikasi.
app.get("/Members",authenticateToken,(req,res) => {
    const ambil = "SELECT * FROM clan"
    db.query(ambil,(err,result) =>{
        if(err) throw err
        const parse = JSON.parse(JSON.stringify(result))
        res.send(parse)
    })
})

//Insert Data
//Endpoint: /Members
//Metode HTTP: POST
//Deskripsi: Menambahkan anggota baru ke dalam tabel clan. Endpoint ini juga dilindungi oleh JWT.
app.post("/Members",authenticateToken,(req,res) => {
    const nama = req.body.nama
    const poin = req.body.poin
    const insert = `INSERT INTO clan (nama,poin) VALUES (?,?)`
    const values = [nama,poin]

    if(!nama || !poin){
        res.send("Data Tidak Boleh Kosong")
    }

    db.query(insert,values,(err,result) => {
        if(err) throw err
        console.log(result)
        res.send("Data berhasil di tambahkan" )
    })
})

//Hapus Data
//Endpoint: /Members/:id
//Metode HTTP: DELETE
//Deskripsi: Menghapus data anggota dari tabel clan berdasarkan id anggota. Endpoint ini memerlukan autentikasi JWT.
app.delete("/Members/:id",authenticateToken,(req,res) => {
    const idMember = req.params.id
    const input = "DELETE FROM clan WHERE id = ? "
    db.query(input,idMember,(err,result) => {
        if(err) throw err
        res.send("Berhasil di Hapus")
    })
})

//Update Data Anggota (PUT)
//Endpoint: /Members/:id
//Metode HTTP: PUT
//Deskripsi: Memperbarui seluruh data anggota di tabel clan berdasarkan id. Semua field (nama dan poin) harus diisi. 
//Endpoint ini memerlukan autentikasi JWT.
app.put("/Members/:id",authenticateToken,(req,res) => {
    const add1 = req.body.nama
    const add2 = req.body.poin
    const idMember = req.params.id

    if(!(add1 && add2)){
        return res.send("Tidak Bleh Kosong")
    }
    const update = "UPDATE clan SET nama = ?, poin =? WHERE id = ?"
    const values = [add1,add2,idMember]

        db.query(update,values,(err,) => {
            if(err) throw err
            res.send("Data Berhasil di Update")
        })
})

//Update Data Anggota (PATCH)
//Endpoint: /Members/:id
//Metode HTTP: PATCH
//Deskripsi: Memperbarui sebagian data anggota di tabel clan berdasarkan id. Tidak semua field harus diisi. 
//Endpoint ini memerlukan autentikasi JWT.
app.patch("/Members/:id",authenticateToken,(req, res) => {
    const idMember = req.params.id;
    const updates = req.body;

    if(!updates || Object.keys(updates).length === 0){
        res.send("Data tidak boeh kosong")
    }

    let query = "UPDATE clan SET ";
    const value = []

    for(let i in updates){
        query += `${i} = ?,`
        value.push(updates[i])
    }

    query = query.slice(0,-1)
    query += " WHERE id = ?"
    value.push(idMember)

    db.query(query,value,(err,result) => {
        if(err) throw err
        res.send("Update Berhasil")
    })
});

//Menampilkan Data Anggota Berdasarkan ID
//Endpoint: /Members/:id
//Metode HTTP: GET
//Deskripsi: Mengambil data anggota dari tabel clan berdasarkan id. Endpoint ini memerlukan autentikasi JWT.
app.get("/Members/:id",authenticateToken,(req,res) => {
    const idMember = req.params.id
    
    const data = "SELECT * FROM clan WHERE id = ?"

    db.query(data,idMember,(err,result) => {
        if(err) throw err
        console.log(result)
        res.send(result)
    })
})

//Sistem Perangkingan
//Endpoint: /Rank
//Metode HTTP: GET
//Deskripsi: Menampilkan daftar anggota dari tabel clan yang diurutkan berdasarkan poin secara menurun (dari yang tertinggi). 
//Endpoint ini memerlukan autentikasi JWT.
app.get("/Rank",authenticateToken,(req,res) => {
    const input = "SELECT * FROM clan ORDER BY poin DESC"

    try {
        db.query(input,(err,result) => {
            if(err) throw err
            const rankedResult = result.map((item,index) => ({
                rank: index + 1,
                ...item
            })) 
            res.send(rankedResult);
        })   
    } catch (error) {
        res.status(500),send("Bad Request")
    }

})

//Mengurutkan Berdasarkan Nama
//Endpoint: /alfa
//Metode HTTP: GET
//Deskripsi: Menampilkan daftar nama anggota dari tabel clan yang diurutkan secara alfabetis (dari A ke Z). 
//Endpoint ini memerlukan autentikasi JWT.
app.get("/alfa",authenticateToken,(req,res) => {
    const query = "SELECT nama FROM clan ORDER BY nama asc"

    db.query(query,(err,result) => {
        if(err) throw err
        const no = result.map((no,index) =>({
            no : index + 1,
            ...no
        })) 
        res.send(no)
    })
})

//Penjumlahan Semua Poin
//Endpoint: /jumlah
//Metode HTTP: GET
//Deskripsi: Menampilkan total jumlah poin dari seluruh anggota di tabel clan. Endpoint ini memerlukan autentikasi JWT.
app.get("/jumlah",authenticateToken,(req,res) => {
    const query = "SELECT SUM(poin) AS total FROM clan"

    db.query(query,(err,result) => {
        if(err) throw err
        res.send(result)
    })
})

//Eliminasi 5 Anggota Teratas
//Endpoint: /Eleminasi
//Metode HTTP: GET
//Deskripsi: Menampilkan lima anggota teratas dari tabel clan berdasarkan poin, yang diurutkan dari yang tertinggi. 
//Endpoint ini memerlukan autentikasi JWT.
app.get("/Eleminasi",authenticateToken,(req,res) => {
    const query = "SELECT * FROM clan ORDER BY poin DESC LIMIT 5"

    db.query(query,(err,result) => {
        if(err) throw err
        const no = result.map((item,index) => ({
            rank : index + 1,
            ...item
        }))
        res.send(no)
    })
})
app.listen(PORT, ()=> {
    console.log("Terhubung di Port " + PORT)
})