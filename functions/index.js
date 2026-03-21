const { onDocumentCreated } = require("firebase-functions/v2/firestore");

exports.testFunction = onDocumentCreated(
  { document: "test/{id}", region: "us-central1" },
  async (event) => {
    console.log("Test fired:", event.params.id);
  }
);
