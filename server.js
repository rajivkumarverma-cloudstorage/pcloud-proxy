const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const FormData = require("form-data");

const upload = multer({ limits: { fileSize: 1024 * 1024 * 1024 * 200 } }); // 200GB limit

const app = express();

app.post("/upload", upload.single("file"), async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const file = req.file;

    if (!email || !password || !file) {
        return res.send("Missing email/password/file");
    }

    const loginURL =
        "https://api.pcloud.com/user/login?getauth=1&username=" +
        encodeURIComponent(email) +
        "&password=" +
        encodeURIComponent(password);

    let loginRes = await fetch(loginURL);
    let loginJson = await loginRes.json();

    if (loginJson.error) {
        return res.send("Login Failed: " + loginJson.error);
    }

    const auth = loginJson.auth;

    let fd = new FormData();
    fd.append("file", file.buffer, file.originalname);

    const uploadURL =
        "https://api.pcloud.com/uploadfile?auth=" +
        encodeURIComponent(auth) +
        "&path=/";

    let upRes = await fetch(uploadURL, {
        method: "POST",
        body: fd,
    });

    let upJson = await upRes.json();

    if (upJson.error) {
        return res.send("Upload Error: " + upJson.error);
    }

    res.send(
        "Upload Success!\nFile: " +
        upJson.metadata[0].name +
        "\nSize: " +
        upJson.metadata[0].size +
        "\nFileID: " +
        upJson.metadata[0].fileid
    );
});

app.listen(3000, () => console.log("Proxy running on port 3000"))
