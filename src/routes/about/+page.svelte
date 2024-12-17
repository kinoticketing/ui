<script>

    const missionStatement = "Creating a seamless and innovative way to book your movie tickets. Your next cinematic experience is just a click away.";
    const coreValues = [
    {
    title: "Innovation",
    icon: "🚀",
    description: "We embrace the latest technology to simplify ticket booking. " +
    "Our team constantly explores new ways to enhance the user experience, " +
    "from AI-powered recommendations to virtual reality previews of cinema seats."
    },
    {
    title: "Accessibility",
    icon: "🌍",
    description: "We ensure booking tickets is easy and available anytime, anywhere. " +
    "Our platform is designed with a user-first approach, making it intuitive for everyone, " +
    "regardless of their tech-savviness."
    },
    {
    title: "Community",
    icon: "🤝",
    description: "We aim to bring people together through unforgettable movie experiences. " +
    "Our platform not only facilitates ticket booking but also fosters a sense of " +
    "community among film enthusiasts."
    },
    {
    title: "Excellence",
    icon: "🏆",
    description: "We prioritize comfort, satisfaction, and top-notch service in every " +
    "aspect of our platform. From the moment users land on our site to the time " +
    "they're seated in the cinema, we strive for excellence."
    },
    {
    title: "Sustainability",
    icon: "🌱",
    description: "We are committed to promoting environmental responsibility in the " +
    "movie industry. Our digital ticketing system significantly reduces paper waste, " +
    "and we partner with eco-friendly cinemas."
    }
    ];
    
    const teamMembers = [
    { name: "Max Mustermann", role: "Co-Founder & CEO", bio: "Lisa leads our team with passion and determination to create a unique booking platform.", image: "/PlaceholderBlue.png" },
    { name: "Max Mustermann", role: "CTO", bio: "Max focuses on delivering cutting-edge technology and ensuring smooth user experiences.", image: "/PlaceholderBlue.png" },
    { name: "Max Mustermann", role: "Head of Design", bio: "Anna ensures that every element looks great and is user-friendly.", image: "/PlaceholderBlue.png" },
    { name: "Max Mustermann", role: "Marketing Director", bio: "Thomas develops strategies to reach movie enthusiasts and grow our user base.", image: "/PlaceholderBlue.png" },
    { name: "Max Mustermann", role: "Customer Relations Manager", bio: "Sophia ensures our users have the best possible experience with our platform.", image: "/PlaceholderBlue.png" }
    ];
    </script>
    
    <main>
        <section class="about-us">
            <div class="header">
                <h1>About Us</h1>
                </div>
            
            <div class="content">
            <div class="about-section">
            <div class="about-image">
            <img src="/PlaceholderBlue.png" alt="Cinema" />
            </div>
            <div class="about-text">
            <h2>Our Story</h2>
            <p>
            This project is  a collaborative effort among students who are developing this website as a studentprojekt.
            We wanted to create a platform that simplifies booking movie tickets while also encouraging innovation and creativity.
            The plan is for the website to grow into a fully functional platform designed for cinema enthusiasts like you!
            </p>
            <h2>Our Mission</h2>
            <p>{missionStatement}</p>
            </div>
            </div>
            <div>
            <h2>Attention</h2>
            <p>This is a student projekt. We do not sell real tickets. A movietheater where you can watch films with our tickets does not exist.</p>
            </div>
           
            
            <div class="values">
            <h2>Our Core Values</h2>
            <div class="value-grid">
            {#each coreValues as value}
            <div class="value-card">
            <div class="icon">{value.icon}</div>
            <h3>{value.title}</h3>
            <p>{value.description}</p>
            </div>
            {/each}
            </div>
            </div>
            
            <div class="team">
            <h2>Meet Our Team</h2>
            <div class="team-grid">
            {#each teamMembers as member}
            <div class="team-card">
            <div class="profile-image">
            <img src={member.image} alt={member.name} />
            </div>
            <h3>{member.name}</h3>
            <p class="role">{member.role}</p>
            <p>{member.bio}</p>
            </div>
            {/each}
            </div>
            </div>
            </div>
            
            
            </section>
    </main>
    
    <style>
        .about-us {
        font-family: 'Poppins', sans-serif;
        color: #333;
        line-height: 1.6;
        background-color: #f9f9f9;
        }
        
        .header {
text-align: center;
padding: 2rem 0;
background-color: #f9f9f9;
border-bottom: 2px solid #14532d;
}

.header h1 {
font-size: 2.5rem;
color: #14532d;
margin: 0;
}
        
        .content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 3rem 2rem;
        }
        
        .about-section {
        display: flex;
        align-items: center;
        gap: 3rem;
        margin-bottom: 3rem;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        }
        
        .about-image {
        flex: 1;
        height: 400px;
        }
        
        .about-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        }
        
        .about-text {
        flex: 1;
        padding: 2rem;
        }
        
        .about-text h2 {
        color: #14532d;
        margin-bottom: 1rem;
        }
        
        .about-text p {
        margin-bottom: 1.5rem;
        }
        
         .values, .team {
        margin-bottom: 3rem;
        }
        
    
        
        .value-grid, .team-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        }
        
        .value-card, .team-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        text-align: center;
        transition: transform 0.3s ease;
        }
        
        .value-card:hover, .team-card:hover {
        transform: translateY(-5px);
        }
        
        .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        }
        
        .profile-image {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        overflow: hidden;
        margin: 0 auto 1rem;
        }
        
        .profile-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        }
        
        .role {
        font-weight: bold;
        color: #14532d;
        }
        
        
        @media (max-width: 1024px) {
        .value-grid, .team-grid {
        grid-template-columns: repeat(2, 1fr);
        }
        }
        
        @media (max-width: 768px) {
        .about-section {
        flex-direction: column;
        }
        
        .about-image {
        height: 300px;
        }
        
        .value-grid, .team-grid {
        grid-template-columns: 1fr;
        }
        }
        </style>
    