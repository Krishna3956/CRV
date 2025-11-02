export function Footer() {
  return (
    <footer className="border-t bg-card/30 backdrop-blur-sm mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ by{' '}
            <a 
              href="https://www.linkedin.com/in/krishnaa-goyal/" 
              target="_blank" 
              rel="author noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Krishna Goyal
            </a>
            {' '}for the MCP community • © 2025 Track MCP
          </p>
        </div>
      </div>
    </footer>
  )
}
