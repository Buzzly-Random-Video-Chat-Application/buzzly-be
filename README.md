<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Unlicense License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/nquynqthanq/buzzly-be">
    <img src="./src/assets/logo.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">📌 Buzzly Backend - Random Video Chat Platform with AI-Powered Interaction</h3>

  <p align="center">
    Buzzly Backend powers a random video chat platform that connects users globally through spontaneous video conversations, enhanced by AI-driven interaction support. It addresses challenges like language barriers, lack of intelligent conversation aids, and inconsistent connection quality using WebRTC, Socket.io, and AI-powered features.
    <br />
    <a href="https://github.com/nquynqthanq/buzzly-be"><strong>Explore the project »</strong></a>
    <br />
    <br />
    <a href="https://buzzly-fe.vercel.app/">View Demo</a>
    ·
    <a href="https://github.com/nquynqthanq/buzzly-be/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/nquynqthanq/buzzly-be/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

[![Buzzly Screenshot][product-screenshot]](https://buzzly-fe.vercel.app/)

Buzzly Backend is the server-side component of a random video chat platform designed to connect users worldwide through seamless video conversations. By integrating AI-powered features, it enhances interactions with real-time conversation suggestions, language translation, and personalized matchmaking. The project addresses limitations in existing platforms, such as poor conversation quality and language barriers, delivering a secure, scalable, and engaging experience.

**Key Features:**
- Real-time video chat with low-latency streaming via WebRTC and Socket.io.
- AI-driven conversation suggestions and real-time language translation.
- Scalable architecture using Node.js, Express.js, MongoDB, and Redis.
- Advanced user authentication and content filtering for safety.
- Support for multiple languages and responsive design.

Developed as a capstone project at the University of Information Technology, VNU-HCM, Buzzly applies modern technologies and Agile methodologies to create an innovative solution.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![Node.js][Node.js]][Node-url]
- [![Express.js][Express.js]][Express-url]
- [![MongoDB][MongoDB]][MongoDB-url]
- [![Redis][Redis]][Redis-url]
- [![Socket.io][Socket.io]][Socket.io-url]
- [![WebRTC][WebRTC]][WebRTC-url]
- [![Cloudinary][Cloudinary]][Cloudinary-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

Follow these steps to set up the Buzzly Backend locally.

### Prerequisites

- **Node.js** (v16 or higher)
  \`\`\`sh
  npm install npm@latest -g
  \`\`\`
- **MongoDB** (local or cloud instance, e.g., MongoDB Atlas)
- **Redis** (local or cloud instance)
- **Cloudinary Account** (for media storage)

### Installation

1. Clone the repository
   \`\`\`sh
   git clone https://github.com/nquynqthanq/buzzly-be.git
   \`\`\`
2. Navigate to the project directory
   \`\`\`sh
   cd buzzly-be
   \`\`\`
3. Install NPM packages
   \`\`\`sh
   npm install
   \`\`\`
4. Create a \`.env\` file in the root directory with:
   \`\`\`env
   PORT=5000
   MONGODB_URI=<your-mongodb-connection-string>
   REDIS_URL=<your-redis-connection-string>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   JWT_SECRET=<your-jwt-secret>
   \`\`\`
5. Start the server
   \`\`\`sh
   npm start
   \`\`\`
6. Verify the server at \`http://localhost:5000\`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

The Buzzly Backend provides a RESTful API and real-time communication. Examples:

- **User Registration**:
  \`\`\`bash
  curl -X POST http://localhost:5000/api/auth/register -d '{"username":"user","email":"user@example.com","password":"password"}' -H "Content-Type: application/json"
  \`\`\`
- **Video Chat**: Use Socket.io to pair users with a \`join-room\` event.
- **AI Suggestions**: Access conversation prompts via \`/api/ai/suggestions\`.

API documentation: [https://github.com/nquynqthanq/buzzly-be/wiki](https://github.com/nquynqthanq/buzzly-be/wiki)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [x] Core video chat with WebRTC
- [x] AI conversation suggestions
- [x] MongoDB/Redis integration
- [ ] Multi-language AI translation
- [ ] Mobile apps for iOS/Android
- [ ] Premium features (ad-free, exclusive filters)
- [ ] Advanced AI content moderation

See open issues: [https://github.com/nquynqthanq/buzzly-be/issues](https://github.com/nquynqthanq/buzzly-be/issues)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are welcome! To contribute:

1. Fork the Project
2. Create a Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit Changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the Unlicense License. See \`LICENSE.txt\` for details.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Nguyen Quoc Thang - [https://linkedin.com/in/nquynqthanq](https://linkedin.com/in/nquynqthanq) - nquynqthanq@example.com

Project Link: [https://github.com/nquynqthanq/buzzly-be](https://github.com/nquynqthanq/buzzly-be)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

- University of Information Technology, VNU-HCM
- Dr. Do Thi Thanh Tuyen
- [WebRTC Documentation](https://webrtc.org/)
- [Socket.io Documentation](https://socket.io/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Choose an Open Source License](https://choosealicense.com)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/nquynqthanq/buzzly-be.svg?style=for-the-badge
[contributors-url]: https://github.com/nquynqthanq/buzzly-be/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/nquynqthanq/buzzly-be.svg?style=for-the-badge
[forks-url]: https://github.com/nquynqthanq/buzzly-be/network/members
[stars-shield]: https://img.shields.io/github/stars/nquynqthanq/buzzly-be.svg?style=for-the-badge
[stars-url]: https://github.com/nquynqthanq/buzzly-be/stargazers
[issues-shield]: https://img.shields.io/github/issues/nquynqthanq/buzzly-be.svg?style=for-the-badge
[issues-url]: https://github.com/nquynqthanq/buzzly-be/issues
[license-shield]: https://img.shields.io/github/license/nquynqthanq/buzzly-be.svg?style=for-the-badge
[license-url]: https://github.com/nquynqthanq/buzzly-be/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/nquynqthanq
[product-screenshot]: ./src/assets/screenshot.png
[Node.js]: https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
[Express.js]: https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[MongoDB]: https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/
[Redis]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[Socket.io]: https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white
[Socket.io-url]: https://socket.io/
[WebRTC]: https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white
[WebRTC-url]: https://webrtc.org/
[Cloudinary]: https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white
[Cloudinary-url]: https://cloudinary.com/