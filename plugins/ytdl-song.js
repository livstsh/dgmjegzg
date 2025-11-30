*Selected:* ${selectedOption.type} Format, ${selectedOption.quality}
*Status:* _Fetching download link, please wait..._
`;
    // 2. --- Send the Detailed Thumbnail Image first ---
    if (image) {
        await conn.sendMessage(from, {
            image: { url: image },
            caption: `👑 *KAMRAN MD VIDEO DOWNLOADER* 👑\n\n${detailedInfo}`,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });
    } else {
        await reply(`⏳ Video found: *${title}*. Fetching link for ${selectedOption.quality}...`); 
    }
    
    // 3. Call the external 'ytdl' API
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        res = await axios.get(apiUrl);
        
        downloadData = res.data.result;
        videoUrl = downloadData?.mp4; 
        
    } catch (apiError) {
        console.error("Axios API Call Failed:", apiError.message);
        return reply(`❌ External download service connection failed. Please try again later.`); 
    }

    // 4. Check API response and URL validity
    if (!res.data.status || !videoUrl || typeof videoUrl !== 'string' || videoUrl.length < 10) {
      console.error("Video API structure error (Missing mp4 link):", res.data);
      return reply("❌ Download service failed to generate a video link."); 
    }

    // 5. --- Send the Final Media (Video or Document) ---
    try {
        const fileName = `${title} (${selectedOption.quality}).${selectedOption.type === 'Video' ? 'mp4' : 'doc'}`;
        
        await conn.sendMessage(from, {
          // Send as video or document based on user selection.
          [selectedOption.type === 'Video' ? 'video' : 'document']: { url: videoUrl }, 
          mimetype: "video/mp4", // Mimetype remains mp4 as source is mp4
          fileName: fileName,
          caption: `✅ *${downloadData.title || title}* Downloaded Successfully!\n*Format:* ${selectedOption.type}, ${selectedOption.quality}\n\n_POWERED BY KAMRAN MD_`,
          contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });

    } catch (mediaError) {
        console.error("Media Send Failed:", mediaError.message);
        return reply("⚠️ Video link found, but failed to send the media. The file might be too large or the link may have expired.");
    }

  } catch (e) {
    console.error("vdl General command error:", e.name, e.message);
    reply("❌ A general command processing error occurred. Please try a different query.");
  }
});
