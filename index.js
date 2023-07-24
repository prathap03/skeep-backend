const express = require('express');
const app = express();

// Import body-parser and set up urlencodedParser
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use('/uploads',express.static('uploads'));
const fs = require('fs');

const multer = require('multer');

const localStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'uploads')
    },
    filename: (req,file,cb)=>{
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1E9)
        console.log(file.originalname.split("."))
        cb(null,file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.')[1])
    }
})

const upload = multer({storage:localStorage});

// Enable CORS for all origins
const cors = require('cors');
app.use(cors({
    origin: '*'
}));

const port = 3000;

app.get('/', async (req, res) => {
    // Get the notes from storage
    var notes = await storage.getItem('notes');

    // Get the current timestamp
    const timestamp = Date.now();
    const dateObject = new Date(timestamp);

    // Send the notes and timestamp in the response
    res.status(200).send({ notes: notes, timestamp: dateObject });
});

app.post('/addNotes',upload.single('noteImage') ,urlencodedParser, async (req, res) => {
    try {
        // Get the current list of notes
        let notes = await storage.getItem('notes');

        // New note to add
        const newNote = {
            "id": 127,
            "Title": "Joe",
            "Body": "hi this is joe",
            "List": [{ "title": "2", "completed": false }],
            "image": "http://localhost:3000/uploads/"+req.file.filename,
            "tags": ["nextjs"],
            "time": "12:00 AM 22/07/2003"
        };

        // Check if the note already exists based on the unique identifier (id)
        const isNoteExists = notes.some((note) => note.id === newNote.id);

        if (!isNoteExists) {
            // Add the new note to the list
            notes.push(newNote);

            // Save the updated list back to storage
            await storage.setItem('notes', notes);

            res.status(200).send("Note Added Successfully");
        } else {
            res.status(400).send("Note Already Exists");
        }
    } catch (err) {
        console.error('Error adding note:', err);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/removeNotes', urlencodedParser, async (req, res) => {
    // Note ID to remove
    var id = 124;
    // Get the current list of notes
    var notes = await storage.getItem('notes');
    var temp = []
    // Filter out the note with the given ID
    notes.map(note => {
        if (note.id != id) {
            temp.push(note)
        }
    });
    // Save the updated list back to storage
    storage.setItem('notes', temp);
    res.status(200).send("Note ${id} removed successfully");
});


app.get('/updateNotes',urlencodedParser,async (req,res)=>{
    var id=124;
    var notes = await storage.getItem('notes');
    for(var i=0;i<notes.length;i++){
        if(notes[i].id==id){
            notes[i]=req.body.note;
        }
    }
    res.status(200).send(`Note ${id} updated successfully`)
})

app.post('/search', urlencodedParser, async (req, res) => {
    // Search key
    // console.log(req.body.key)
    let key = req.body.key;
    // Get the current list of notes
    var notes = await storage.getItem('notes');
    // console.log(notes);
    var temp = []
    notes.map((note, idx) => {
        // console.log(note);
        // Check if the note matches the search key in its Title or Body
        if ((note.Title.toLowerCase().includes(key.toLowerCase()) || note.Body.toLowerCase().includes(key.toLowerCase()))) {
            temp.push(note);
        }

        // Check if the search key exists in the tags of the note
        note.tags.map(tag => {
            if (tag.toLowerCase().includes(key.toLowerCase()) && !temp.includes(note)) {
                temp.push(note);
            }
        });

        // Check if the search key exists in the List titles of the note
        note.List && note.List.map((item) => {
            if (item.title.toLowerCase().includes(key.toLowerCase()) && !temp.includes(note)) {
                temp.push(note);
            }
        });
    });
    // Send the search results in the response
    res.send(temp);
});

const storage = require('node-persist');



app.listen(port, async () => {
    // Initialize storage
    await storage.init();

    // Get the initial list of notes from storage or create it if it doesn't exist
    var notes = await storage.getItem('notes');
    if (!notes) {
        notes = [];
        await storage.setItem('notes', notes);
    }

    console.log(`REST API Notes System listening on port ${port}`);
});
