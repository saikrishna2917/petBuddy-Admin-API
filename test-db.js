require('dotenv').config();
const mongoose = require('mongoose');
const petsModel = require('./src/models/petsModel');
const PetOwnerProfile = require('./src/models/petOwnersProfileModel');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const pets = await petsModel.find({ isDeleted: false });
        console.log("Total pets in DB:", pets.length);
        
        const petOwnerIds = pets.map(p => p.petOwnerID.toString());
        console.log("Owners with pets:", [...new Set(petOwnerIds)]);

        const owners = await PetOwnerProfile.find({ isDeleted: false }).lean();
        console.log("Total owners in DB:", owners.length);
        console.log("Owner IDs in DB:", owners.map(o => o._id.toString()));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
});
