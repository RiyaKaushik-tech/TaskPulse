import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        task:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            require :true,
            index: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            require: true
        },
        content:{
            type: String,
            require: true,
            trim: true
        },
        mentions:[{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },],
        parentComment:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default :null
        },
        replies:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment",
            }
        ],
        attachment:[{
            filename: String,
            url: String,
            mimetype:String,
            size: Number
        }],
        isEdited:{
            type: Boolean,
            default: false
        },
        editedAt: Date,
        isDeleted:{
            type: Boolean,
            default: false,
        },
        reaction:[
            {
                user:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref:"User"
                },
                emoji: String,
                createdAt:{
                    type: Date, 
                    default: Date.now(),
                }
            },
        ]
    },
    {
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
);

commentSchema.index({task: 1, createdAt: -1});
commentSchema.index({author: 1});
commentSchema.index({mentions: 1});

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;