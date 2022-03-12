import mongoose from "mongoose";
import puppeteer from "puppeteer";
import cheerio from "cheerio";
import Dbmodel from "./Model/DbModel.js";
import Logger from "./logger.js";
async function dbConnect() {
  try {
    await mongoose.connect(
      "mongodb+srv://thehumfree:cream123@thehumfree.7a2ll.mongodb.net/workableJobs?retryWrites=true&w=majority"
    );
    Logger.log("info", "Database connected");
  } catch (error) {
    Logger.error(error);
  }
}

class Workable {
  constructor(_url, _time) {
    this.url = _url;
    this.time = _time;
  }
  async run() {
    try {
      await dbConnect();
      const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
        headless: true,
      });
      const tab = await browser.newPage();
      for (let offset = 0; offset < 10000; offset += 10) {
        await tab.goto(this.url + offset);

        const content = await tab.content();
        const $ = await cheerio.load(content);

        let result = $("#app > main > div > div > div > ul > li > div")
          .map((index, element) => {
            const jobTitle = $(element)
              .find(
                "div.styles__job-card-details--3Y4SR > div > h2 > strong > a"
              )
              .text();
            const jobRaw = $(element).find("a").attr("href");
            const jobUrl = `https://jobs.workable.com${jobRaw}`;
            const time = $(element)
              .find("div.styles__job-card-details--3Y4SR > span")
              .text();

            //scrapes today's job only
            if (time.match(/today/gi)) {
              //looking for front end jobs
              if (
                jobTitle.match(/node/gi) ||
                jobTitle.match(/back/gi) ||
                jobTitle.match(/javascript/gi) ||
                jobTitle.match(/software/gi) ||
                jobTitle.match(/developer/gi)
              ) {
                const date = Date.now();
                return { jobTitle, jobUrl, date };
              }
            } else {
              return 1;
            }
          })
          .get();
        if (result[result.length - 1] === 1) {
          Logger.log("info", "Job Searched Successfully");
          browser.close();
          mongoose.disconnect();
          break;
        } else {
          await Promise.all(
            result.map(async (res) => {
              const checkData = await Dbmodel.findOne({
                jobTitle: res.jobTitle,
              });
              if (!checkData) {
                res.createdAt = Date.now();
                //saves to database
                const addData = new Dbmodel(res);
                addData.save();
                Logger.log("info", "Data Entered to Database");

                //using a setTimeout to delay scraping
                await this.sleep(this.time);
              }
            })
          );
        }
      }
    } catch (error) {
      Logger.error(error);
    }
  }

  //sleep interval function
  async sleep(milseconds) {
    return await new Promise((resolve) => setTimeout(resolve, milseconds));
  }
}

async function main() {
  const workable = new Workable(
    "https://jobs.workable.com/search?remote=true&offset=",
    2000
  );
  workable.run();
}

main();
