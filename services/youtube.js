// import { exec } from "child_process";
// import tmp from "tmp";
// import fs from "fs";
// import { speechToText } from "./stt.js";

// // Hàm tải audio từ YouTube bằng yt-dlp
// async function downloadYoutubeAudio(url) {
//   const tmpFile = tmp.fileSync({ postfix: ".wav" }); // lưu trực tiếp .wav

//   await new Promise((resolve, reject) => {
//     // -x: chỉ tải audio
//     // --audio-format wav: convert audio sang wav
//     // -o <file>: output path
//     const cmd = `yt-dlp -x --audio-format wav -o "${tmpFile.name}" "${url}"`;
//     exec(cmd, (err, stdout, stderr) => {
//       if (err) {
//         console.error("yt-dlp error:", stderr);
//         reject(err);
//       } else {
//         console.log("yt-dlp stdout:", stdout);
//         resolve();
//       }
//     });
//   });

//   return tmpFile.name;
// }

// export async function youtubeToText(url) {
//   const pathFile = await downloadYoutubeAudio(url);
//   const text = await speechToText(pathFile);
//   return text;
// }
