const m = await import("/home/user/Taxila/server/director/requests.js");
for (const t of ["cylinder... gol hai na side se? lekin cake toh photo mein dekha tha book mein... cylinder dikhao", "कोन मतलब आइसक्रीम कोन। या एकदम पॉइंटी वाला कैप भी, पर वो कुकिंग नहीं है। पर आइसक्रीम कोन कुकिंग है। दी कोन दिखाओ।", "maine photo mein dekha tha, aloo dikhao"])
  console.log(JSON.stringify(m.visualAskOf(t)));
