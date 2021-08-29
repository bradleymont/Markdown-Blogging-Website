import { Component, OnInit } from '@angular/core';
import { Post, BlogService } from '../blog.service';
import { Parser, HtmlRenderer } from 'commonmark';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnInit {

  // holds a copy of the post that is currently being previewed
  previewPost: Post;

  constructor(private route: ActivatedRoute, private router: Router, private blogService: BlogService) { }

  // gets the post thats currently being previewed, and compiles the markdown into HTML
  async getPreviewPost(): Promise<void>
  {
    try
    {
      // use the BlogService to obtain the post to display
      let storedPost: Post = this.blogService.getCurrentDraft();

      // retrieve the postid of the post from the URL
      let urlPostid: number = +this.route.snapshot.paramMap.get('id');

      // if storedPost is null or if it has a different postid than the one in the URL
      if (storedPost == null || storedPost.postid != urlPostid)
      {
        // obtain the post from the Express server using the BlogService
        this.previewPost = await this.blogService.getPost(this.blogService.getUsername(), urlPostid);
      }
      else // the postids match
      {
        this.previewPost = storedPost;
      }

      // set the currentDraft to be this.post
      this.blogService.setCurrentDraft(this.previewPost);
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // function that takes in a string in markdown format and returns its HTML version
  compileMarkdown(md: string): string
  {
      // use commonmark to compile markdown into HTML
      let reader = new Parser();
      let writer = new HtmlRenderer();
      
      let parsed = reader.parse(md);
      return writer.render(parsed);
  }

  goBackToEdit(): void
  {
    // redirect to the edit page
    this.router.navigate(['/', 'edit', this.previewPost.postid]);
  }

  ngOnInit(): void 
  {
    this.route.paramMap.subscribe(() => {
      // do something
      this.getPreviewPost();
    });
  }

}
