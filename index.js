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
    console.log("info", "Database connected");
  } catch (error) {
    console.error(error);
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
                jobTitle.match(/developer/gi) ||
                jobTitle.match(/cloud/gi) ||
                jobTitle.match(/engineer/gi)
              ) {
                return { jobTitle, jobUrl };
              }
            } else {
              return 1;
            }
          })
          .get();

        if (result[result.length - 1] === 1) {
          console.log("info", "Job Searched Successfully");
          browser.close();
          mongoose.disconnect();
          break;
        } else {
          await this.jobdes(result, tab);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async jobdes(result, tab) {
    try {
      for (let i = 0; i < result.length; i++) {
        const checkData = await Dbmodel.findOne({
          jobUrl: result[i].jobUrl,
        });
        if (!checkData) {
          await tab.goto(`${result[i].jobUrl}`);
          const html = await tab.content();
          const $ = await cheerio.load(html);
          result[i].jobApplicationLink = $(
            '[data-ui="overview-apply-now"]'
          ).attr("href");
          result[i].jobDescription = $(
            ".JobBreakdown__job-breakdown--3whe3"
          ).html();

          result[i].companyName = $(".jobOverview__link--1aY_B").text();
          if (
            result[i].jobDescription.match(/node/gi) ||
            result[i].jobDescription.match(/javascript/gi) ||
            result[i].jobDescription.match(/typescript/gi)
          ) {
            //saves to database
            const addData = new Dbmodel(result[i]);
            addData.save();
            Logger.log("info", "Data Entered to Database");
            console.log("Job Added");
            // console.log(result[i]);
            //using a setTimeout to delay scraping
            await this.sleep(this.time);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  //sleep interval function
  async sleep(milseconds) {
    return await new Promise((resolve) => setTimeout(resolve, milseconds));
  }
  async delete() {
    try {
      const data = await Dbmodel.deleteMany();
    } catch (error) {
      console.log(error);
    }
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
