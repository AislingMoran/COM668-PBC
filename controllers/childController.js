const Child = require("../models/Child");

// Add Child to Parent Account
exports.addChild = async (req, res) => {
    try {
        if (!req.user || !req.user.role.includes("parent")) {
            return res.status(403).send("Only parents can add children.");
        }

        const { firstName, surname, gender, dob } = req.body;
        const newChild = new Child({
            parent: req.user._id,
            firstName,
            surname,
            gender,
            dob: new Date(dob)
        });

        await newChild.save();
        res.redirect("/dashboard"); // Redirect after saving
    } catch (error) {
        console.error("Error adding child:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Get All Children for a Parent
exports.getChildrenForParent = async (req, res) => {
    try {
        if (!req.user || !req.user.role.includes("parent")) {
            return res.status(403).send("Unauthorized");
        }

        const children = await Child.find({ parent: req.user.userid });
        res.render("childrenList", { children });
    } catch (error) {
        console.error("Error fetching children:", error);
        res.status(500).send("Internal Server Error");
    }
};
